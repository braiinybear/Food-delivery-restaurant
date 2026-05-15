import SplashScreenView from "@/components/SplashScreenView";
import { useUser } from "@/hooks/useUser";
import { Colors as StaticColors } from "@/constants/colors";
import * as NavigationBar from "expo-navigation-bar";
// Better-auth authentication.
import { authClient } from "@/lib/auth-client";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";

// Expo splash screen.
import * as ExpoSplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from "react-native"; 
import GlobalCustomAlert from "@/components/GlobalCustomAlert";
import { NotificationProvider } from "@/context/NotificationContext";
import * as Notifications from "expo-notifications";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { AppUser } from "@/types/user";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
  }),
});

// Keep the native splash visible while we load
ExpoSplashScreen.preventAutoHideAsync();

// Create a client outside the component to prevent re-instantiation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 15, // Unused data is garbage collected after 15 minutes
      retry: 2, // Retry failed requests twice before throwing an error
      refetchOnWindowFocus: false, // Turn off for less aggressive fetching
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemedRoot() {
  const { Colors, isDark } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const { isLoading: isUserLoading } = useUser({ enabled: !!session });
  const [splashDone, setSplashDone] = useState<boolean>(false);

  // Font loading
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_900Black,
  });

  // Combined readiness check
  const isAppReady = fontsLoaded;

  // Hide splash screen when app is ready
  const onLayoutRootView = useCallback(async () => {
    if (isAppReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [isAppReady]);

  // Make Android nav bar buttons match theme
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
      NavigationBar.setBackgroundColorAsync(Colors.background);
    }
  }, [isDark, Colors.background]);

  // Show nothing until fonts are ready
  if (!isAppReady) return null;

  const isLoggedIn = !isPending && !!session;
  const isLoggedOut = !isPending && !session;

  return (
    <NotificationProvider>
      <SocketProvider user={session?.user as AppUser | undefined}>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <StatusBar style={isDark ? "light" : "dark"} />
          {/* BLOCK UI while auth session restores, splash animation is running, or session is being verified */}
          {(!splashDone || isPending || (session && isUserLoading)) ? (
            <SplashScreenView onFinish={() => setSplashDone(true)} />
          ) : (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              {/* Only accessible when not logged in */}
              <Stack.Protected guard={isLoggedOut}>
                <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
              </Stack.Protected>

              {/* Only accessible when logged in */}
              <Stack.Protected guard={isLoggedIn}>
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="restaurantForm"
                  options={{
                    headerShown: true,
                    headerTitle: "Become a Partner",
                    headerTintColor: Colors.primary,
                    headerStyle: {
                      backgroundColor: isDark ? Colors.background : Colors.secondary,
                    },
                    headerTitleAlign: "center",
                    headerTitleStyle: {
                      color: Colors.primary,
                      fontFamily: 'Nunito_700Bold',
                    },

                    headerLeft: () => (
                      <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ marginLeft: 15 }}
                      >
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                      </TouchableOpacity>
                    ),
                  }}
                />
                <Stack.Screen name="menucategory" options={{ headerShown: false }} />
                <Stack.Screen name="menuitem" options={{ headerShown: false }} />
                <Stack.Screen name="restaurantProfile" options={{
                  headerShown: true,
                  headerTitle: "Restaurant Profile",
                  headerTintColor: Colors.primary,
                  headerStyle: {
                    backgroundColor: isDark ? Colors.background : Colors.secondary,
                  },
                  headerTitleAlign: "center",
                  headerTitleStyle: {
                    color: Colors.primary,
                    fontFamily: 'Nunito_700Bold',
                  },
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => router.back()}
                      style={{ marginLeft: 15 }}
                    >
                      <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  ),
                }} />

                <Stack.Screen name="notifications" options={{
                  headerShown: true,
                  headerTitle: "Notifications",
                  headerTintColor: Colors.primary,
                  headerStyle: {
                    backgroundColor: isDark ? Colors.background : Colors.secondary,
                  },
                  headerTitleAlign: "center",
                  headerTitleStyle: {
                    color: Colors.primary,
                    fontFamily: 'Nunito_700Bold',
                  },
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => router.back()}
                      style={{ marginLeft: 15 }}
                    >
                      <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  ),
                }} />
              </Stack.Protected>
            </Stack>
          )}
        </View>
      </SocketProvider>
      <GlobalCustomAlert />
    </NotificationProvider>
  );
}

const transitionStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
