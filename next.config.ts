import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Set NEXT_BUILD_NATIVE=true to produce a static export for Capacitor.
// The resulting `out/` directory is bundled into the iOS app (webDir in capacitor.config.ts).
const isNativeBuild = process.env.NEXT_BUILD_NATIVE === "true";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Disable PWA service worker for native builds (Capacitor manages offline)
  disable: process.env.NODE_ENV === "development" || isNativeBuild,
});

const nextConfig: NextConfig = {
  // Static export for the Capacitor iOS bundle; standard SSR for Pi/server.
  ...(isNativeBuild ? { output: "export" } : {}),

  // Keep Node.js-specific packages out of the webpack bundle.
  // Ignored in static export mode (no server), but harmless to keep.
  serverExternalPackages: ["node-ical", "better-sqlite3", "@prisma/adapter-better-sqlite3"],

  // Headers only apply in server mode (not supported by static export).
  ...(!isNativeBuild
    ? {
        async headers() {
          return [
            {
              source: "/sw.js",
              headers: [
                { key: "Service-Worker-Allowed", value: "/" },
                { key: "Cache-Control", value: "no-cache" },
              ],
            },
          ];
        },
      }
    : {}),
};

export default withSerwist(nextConfig);
