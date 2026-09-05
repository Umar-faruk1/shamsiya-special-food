import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "../context/AppContext";
import { ToastHost } from "../components/ToastHost";
import { useApp } from "../context/AppContext";

function AuthGuard() {
  const { isAuthenticated } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const firstSegment = segments[0];
  const currentRoute = segments[1];

  useEffect(() => {
    if (firstSegment === undefined) return;

    const isAuthRoute = firstSegment === "(auth)";
    const isLocationSetup = isAuthRoute && currentRoute === "location-setup";

    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/(auth)/splash");
    } else if (isAuthenticated && isAuthRoute && !isLocationSetup) {
      router.replace(currentRoute === "login" ? "/(auth)/location-setup" : "/");
    }
  }, [currentRoute, firstSegment, isAuthenticated, router]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          {/* Main Stack Routing Container replacing RootNavigator & NavigationContainer */}
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />

          <AuthGuard />

          {/* Global overlays and status bar stay top-level */}
          <ToastHost />
          <StatusBar style="dark" />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
