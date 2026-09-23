import type { ExpoConfig } from "expo/config";
import { readFileSync } from "fs";
import path from "path";

const pkg = JSON.parse(readFileSync(path.join(__dirname, "../../package.json"), "utf8")) as {
  version: string;
};

export default (): ExpoConfig => ({
  name: "Word Lock",
  slug: "word-lock",
  version: pkg.version,
  orientation: "portrait",
  scheme: "wordlock",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    bundleIdentifier: "me.cbsdev.wordlock",
    supportsTablet: false,
  },
  android: {
    package: "me.cbsdev.wordlock",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#fbf9ed",
    },
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#fbf9ed",
      },
    ],
    "expo-status-bar",
    "expo-web-browser",
    "expo-image",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: undefined,
    },
  },
});
