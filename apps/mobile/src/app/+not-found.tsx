import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";

/**
 * Native counterpart of `apps/web`'s `not-found.tsx` — `expo-router`'s
 * file-name convention (`+not-found.tsx`) for the equivalent of a 404: any
 * unmatched route lands here. Same content as web (404 heading, "Page not
 * found", a way back to `/`), since a device has no crawler to serve a
 * status code to — this is purely a dead-end screen for a bad deep link or
 * a stale room-code URL.
 */
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="w-full max-w-sm items-center">
        <Text className="font-display text-7xl font-bold text-foreground">404</Text>
        <Text className="mt-4 text-xl font-semibold text-foreground">Page not found</Text>
        <Text className="font-sans mt-2 text-center text-sm text-mutedForeground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>
        <View className="mt-6 w-full">
          <Button variant="sky" onPress={() => router.replace("/")}>
            Go home
          </Button>
        </View>
      </View>
    </View>
  );
}
