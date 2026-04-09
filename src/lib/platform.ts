/**
 * Platform detection utilities.
 *
 * Import these helpers anywhere — they are safe to call during SSR
 * (they return false on the server where `window` is undefined).
 */

/** True when running inside a Capacitor native wrapper (iOS/Android). */
export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // Capacitor injects this global when running inside the native shell.
  return !!(window as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();
}

/** True when running as an installed PWA (standalone display mode). */
export function isPwa(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

/** The platform string: "ios" | "android" | "web". */
export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as { Capacitor?: { getPlatform?: () => string } })
    .Capacitor;
  const platform = cap?.getPlatform?.();
  if (platform === "ios" || platform === "android") return platform;
  return "web";
}
