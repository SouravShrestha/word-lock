// iOS 27 traps at launch unless the app adopts the scene life cycle, and Expo's
// SDK 57 template still creates the window in the app delegate. This wires up
// expo's own ExpoAppSceneDelegate. Drop it once the template does this itself.
const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

const SCENE_DELEGATE = "\nclass SceneDelegate: ExpoAppSceneDelegate {}\n";

module.exports = function withSceneDelegate(config) {
  config = withAppDelegate(config, (c) => {
    let src = c.modResults.contents;
    if (src.includes("ExpoAppSceneDelegate")) return c;
    src = src.replace(
      "class AppDelegate: ExpoAppDelegate {",
      "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {",
    );
    // The scene delegate creates the window and starts React Native into it.
    src = src.replace(/#if os\(iOS\) \|\| os\(tvOS\)\s*window = UIWindow[\s\S]*?#endif\n/, "");
    if (!src.includes("ExpoReactNativeFactoryProvider") || src.includes("startReactNative(")) {
      throw new Error(
        "withSceneDelegate: AppDelegate.swift no longer matches the expected template",
      );
    }
    c.modResults.contents = src + SCENE_DELEGATE;
    return c;
  });

  return withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return c;
  });
};
