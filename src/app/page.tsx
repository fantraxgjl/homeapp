"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNative } from "@/lib/platform";

// Root page: redirect based on session.
// In native mode: always start at /kids (PIN lock is handled by PinLockOverlay).
// In server mode: check cookie server-side — but static export can't use cookies(),
// so we do a client-side redirect in both modes.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isNative()) {
      // In native/static mode, let PinLockOverlay manage the lock state.
      // Default to /dashboard; PinLockOverlay will show the keypad over it.
      router.replace("/dashboard");
      return;
    }
    // In server/Pi mode: check the session cookie client-side as a fallback.
    const hasCookie = document.cookie.includes("homeapp-session");
    router.replace(hasCookie ? "/dashboard" : "/kids");
  }, [router]);

  return null;
}
