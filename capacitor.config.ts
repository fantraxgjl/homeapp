import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.family.homeapp",
  appName: "Family Dashboard",

  // Points at the static export output from `npm run build:native`.
  // After building, run `npm run cap:sync` to copy it into the Xcode project.
  webDir: "out",

  ios: {
    // Required for HomeKit entitlement — add in Xcode under Signing & Capabilities.
    // App.entitlements must contain: <key>com.apple.developer.homekit</key><true/>
    scheme: "Family Dashboard",
  },

  plugins: {
    // Use native HTTP for Open-Meteo calls (avoids WebView CORS restrictions).
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
