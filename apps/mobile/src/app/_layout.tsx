import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import "./globals.css";

import {
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import { useFonts } from "expo-font";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProviders } from "@/components/AppProviders";
import { useBlockHardwareBack } from "@/hooks/useBlockHardwareBack";

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="w-full max-w-sm items-center">
        <Text className="text-xl font-semibold text-foreground">This page didn&apos;t load</Text>
        <Text className="font-sans mt-2 text-center text-sm text-mutedForeground">
          Something went wrong. You can try again or head back home.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          className="mt-6 w-full items-center rounded-lg px-4 py-3.5"
          style={{ backgroundColor: "#38bdf8" }}
        >
          <Text className="text-base font-bold text-white">Try again</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout() {
  useBlockHardwareBack();

  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className="bg-background">
      <SafeAreaProvider>
        <AppProviders>
          <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="game/[code]" />
            <Stack.Screen name="join" />
            <Stack.Screen name="how-to-play" />
            <Stack.Screen name="legal/privacy" />
          </Stack>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
