import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "homeapp-session";

// GET - check if session is valid
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return NextResponse.json({ valid: !!session?.value });
}

// DELETE - clear session (lock dashboard)
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}
