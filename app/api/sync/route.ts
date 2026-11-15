import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Task, LedgerEntry } from "@/lib/types";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: "Authentication required to sync data",
    });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      notConfigured: true,
      error: "DATABASE_URL is not set. Add your Neon DB connection string to environment variables.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        tasks: true,
        ledger: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const tasks: Task[] = user.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      durationMin: t.durationMin,
      points: t.points,
      date: t.date,
      status: t.status as Task["status"],
      attempts: t.attempts,
      startedAt: t.startedAt ? Number(t.startedAt) : undefined,
      completedAt: t.completedAt ? Number(t.completedAt) : undefined,
    }));

    const ledger: LedgerEntry[] = user.ledger.map((l) => ({
      id: l.id,
      date: l.date,
      delta: l.delta,
      reason: l.reason as LedgerEntry["reason"],
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
      state: {
        tasks,
        ledger,
        activeTaskId: user.activeTaskId,
        schemaVersion: 1,
      },
    });
  } catch (error) {
    console.error("[Sync GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load user data from Neon DB" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { success: false, authenticated: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      notConfigured: true,
      error: "DATABASE_URL is not set. Add your Neon DB connection string to environment variables.",
    });
  }

  try {
    const body = await req.json();
    const { state } = body;

    if (!state) {
      return NextResponse.json(
        { success: false, error: "Missing state payload" },
        { status: 400 }
      );
    }

    const tasksList: Task[] = Array.isArray(state.tasks) ? state.tasks : [];
    const ledgerList: LedgerEntry[] = Array.isArray(state.ledger) ? state.ledger : [];
    const activeTaskId: string | null = state.activeTaskId || null;

    await prisma.$transaction(async (tx) => {
      // 1. Update active task
      await tx.user.update({
        where: { id: session.userId },
        data: { activeTaskId },
      });

      // 2. Replace user tasks
      await tx.task.deleteMany({ where: { userId: session.userId } });
      if (tasksList.length > 0) {
        await tx.task.createMany({
          data: tasksList.map((t) => ({
            id: t.id,
            userId: session.userId,
            name: t.name,
            durationMin: t.durationMin,
            points: t.points,
            date: t.date,
            status: t.status,
            attempts: t.attempts || 0,
            startedAt: t.startedAt ? Number(t.startedAt) : null,
            completedAt: t.completedAt ? Number(t.completedAt) : null,
          })),
        });
      }

      // 3. Replace user ledger
      await tx.ledgerEntry.deleteMany({ where: { userId: session.userId } });
      if (ledgerList.length > 0) {
        await tx.ledgerEntry.createMany({
          data: ledgerList.map((l) => ({
            id: l.id,
            userId: session.userId,
            date: l.date,
            delta: l.delta,
            reason: l.reason,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Synced with Neon DB",
      taskCount: tasksList.length,
      ledgerCount: ledgerList.length,
    });
  } catch (error) {
    console.error("[Sync POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save data to Neon DB" },
      { status: 500 }
    );
  }
}
