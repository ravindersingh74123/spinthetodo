import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = body.username?.trim().toLowerCase();
    const password = body.password;

    if (!username || username.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          notConfigured: true,
          error: "DATABASE_URL is not configured yet. Add your Neon DB connection string to environment variables.",
        },
        { status: 503 }
      );
    }

    // Check existing
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    const token = await signAuthToken({
      userId: user.id,
      username: user.username,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
