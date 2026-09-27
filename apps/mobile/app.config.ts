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
    icon: "./assets/wordlock-ios.icon",
  },
  android: {
    package: "me.cbsdev.wordlock",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#131f24",
    },
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#fbf9ed",
        dark: {
          image: "./assets/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#131f24",
        },
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
      projectId: "36850b2b-048e-471f-8fe1-beb552a7bcbd",
    },
  },
});
