import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin, hashPin, isValidPin } from "@/lib/pin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get("homeapp-session")?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPin, newPin } = await req.json();

    if (!newPin || !isValidPin(newPin)) {
      return NextResponse.json(
        { error: "New PIN must be 4–8 digits" },
        { status: 400 }
      );
    }

    const config = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
    });

    if (config?.pinHash && currentPin) {
      const valid = await verifyPin(currentPin, config.pinHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 401 }
        );
      }
    }

    const pinHash = await hashPin(newPin);
    await prisma.appConfig.upsert({
      where: { id: "singleton" },
      update: { pinHash },
      create: { id: "singleton", pinHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pin/update]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
