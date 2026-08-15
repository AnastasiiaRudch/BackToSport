import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider } from "@/src/auth";
import { I18nProvider } from "@/src/i18n";
import { fontAssets, colors } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [fontsLoaded, fontsError] = useFonts(fontAssets);

  const ready = (iconsLoaded || iconsError) && (fontsLoaded || fontsError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <I18nProvider>
            <AuthProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.surface },
                  animation: "slide_from_right",
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="athlete/new" options={{ presentation: "modal" }} />
                <Stack.Screen name="athlete/[id]" />
                <Stack.Screen name="assessment/[profileId]" />
                <Stack.Screen name="compare/[profileId]" />
                <Stack.Screen name="results/[id]" />
              </Stack>
            </AuthProvider>
          </I18nProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
