import { NextRequest, NextResponse } from "next/server";
import { getTursoClient, initTursoSchema } from "@/lib/turso";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Missing sync code parameter" },
      { status: 400 }
    );
  }

  const db = getTursoClient();
  if (!db) {
    return NextResponse.json({
      success: false,
      notConfigured: true,
      error: "Turso is not configured yet. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in environment variables.",
    });
  }

  try {
    await initTursoSchema(db);
    const result = await db.execute({
      sql: "SELECT state_json, updated_at FROM user_sync WHERE sync_code = ?",
      args: [code],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        notFound: true,
        message: "No cloud sync session found for this code",
      });
    }

    const row = result.rows[0];
    const state = JSON.parse(String(row.state_json));
    const updatedAt = Number(row.updated_at);

    return NextResponse.json({
      success: true,
      state,
      updatedAt,
    });
  } catch (error) {
    console.error("[Turso Sync GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read from Turso cloud" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syncCode, state, updatedAt } = body;

    if (!syncCode || !state) {
      return NextResponse.json(
        { success: false, error: "Missing syncCode or state" },
        { status: 400 }
      );
    }

    const normalizedCode = String(syncCode).trim().toUpperCase();
    const stateJson = JSON.stringify(state);
    const timestamp = typeof updatedAt === "number" ? updatedAt : Date.now();

    const db = getTursoClient();
    if (!db) {
      return NextResponse.json({
        success: false,
        notConfigured: true,
        error: "Turso is not configured yet. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in environment variables.",
      });
    }

    await initTursoSchema(db);
    await db.execute({
      sql: `
        INSERT INTO user_sync (sync_code, state_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(sync_code) DO UPDATE SET
          state_json = excluded.state_json,
          updated_at = excluded.updated_at
        WHERE excluded.updated_at >= user_sync.updated_at;
      `,
      args: [normalizedCode, stateJson, timestamp],
    });

    return NextResponse.json({
      success: true,
      syncCode: normalizedCode,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error("[Turso Sync POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to write to Turso cloud" },
      { status: 500 }
    );
  }
}
