import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin, hashPin, isValidPin } from "@/lib/pin";
import { cookies } from "next/headers";

const SESSION_COOKIE = "homeapp-session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    const config = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
    });

    // If no PIN is set yet, first PIN entry sets it
    if (!config || !config.pinHash) {
      if (!isValidPin(pin)) {
        return NextResponse.json(
          { error: "PIN must be 4–8 digits" },
          { status: 400 }
        );
      }
      const pinHash = await hashPin(pin);
      await prisma.appConfig.upsert({
        where: { id: "singleton" },
        update: { pinHash },
        create: { id: "singleton", pinHash },
      });
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, "1", {
        httpOnly: true,
        sameSite: "strict",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
      return NextResponse.json({ success: true, firstSetup: true });
    }

    const valid = await verifyPin(pin, config.pinHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pin/verify]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
