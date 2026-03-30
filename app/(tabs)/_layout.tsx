import * as NavigationBar from "expo-navigation-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const BackButton = () => (
    <TouchableOpacity
      onPress={() => {
      
          router.back();
        
      }}
      activeOpacity={0.7}
      style={{ paddingLeft: 8, paddingRight: 12, height: 44, justifyContent: 'center' }}
    >
      <Ionicons name="arrow-back" size={28} color={Colors.white} />
    </TouchableOpacity>
  );
    useEffect(() => {
        if (Platform.OS !== "android") {
            return;
        }

        void NavigationBar.setPositionAsync("relative");
        void NavigationBar.setBackgroundColorAsync("#E5E7EB");
        void NavigationBar.setBorderColorAsync("#D1D5DB");
        void NavigationBar.setButtonStyleAsync("dark");
    }, []);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: Colors.primary },
                headerTintColor: Colors.white,
                headerTitleStyle: { color: Colors.white },
                tabBarActiveTintColor: Colors.white,
                tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
                tabBarStyle: {
                    backgroundColor: Colors.primary,
                    borderTopWidth: 0,
                    height: 64 + insets.bottom,
                    paddingBottom: 10 + insets.bottom,
                    paddingTop: 6,
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" color={color} size={size - 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: "Orders",
                    headerShown: true,
                    headerLeft: () => <BackButton />,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt-outline" color={color} size={size - 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: "Menu",
                    headerShown: true,
                    headerLeft: () => <BackButton />,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="restaurant-outline" color={color} size={size - 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: "Stats",
                    headerShown: true,
                    headerLeft: () => <BackButton />,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="stats-chart-outline" color={color} size={size - 2} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    headerShown: true,
                    headerLeft: () => <BackButton />,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" color={color} size={size - 2} />
                    ),
                }}
            />
        </Tabs>
    );
}
