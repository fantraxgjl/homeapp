import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.family.homeapp",
  appName: "Family Dashboard",
  // webDir is required by Capacitor CLI but not used when server.url is active.
  // We point it at public/ so the CLI has something to reference.
  webDir: "public",

  // In production the iOS AppDelegate reads the stored server URL from
  // UserDefaults and overrides this at runtime (see ios/App/App/AppDelegate.swift).
  // During local dev, npx cap run ios --livereload uses the Next.js dev server.
  server: {
    // Cleartext HTTP is allowed so the app can reach a local Pi over LAN.
    // For production cloud hosts (Railway, etc.) the URL will be HTTPS.
    cleartext: true,
    // allowNavigation lets the webview follow redirects to the configured host.
    allowNavigation: ["*"],
  },

  ios: {
    // Required for HomeKit entitlement — set in Xcode under Signing & Capabilities.
    // The entitlements file at ios/App/App/App.entitlements must include:
    //   <key>com.apple.developer.homekit</key><true/>
    scheme: "Family Dashboard",
  },

  plugins: {
    // CapacitorHttp: use native HTTP so requests aren't subject to CORS on LAN
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
