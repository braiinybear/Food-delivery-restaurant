import * as NavigationBar from "expo-navigation-bar";
import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NewOrderToast } from "../../components/NewOrderToast";
import { useNewOrderAlert } from "../../hooks/useNewOrderAlert";
import { useAcceptOrder } from "../../hooks/useAcceptOrder";
import { useSocketStore } from "../../store/useSocketStore";
import { useTheme } from "../../context/ThemeContext";

export default function TabsLayout() {
    const { Colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [orderQueue, setOrderQueue] = React.useState<any[]>([]);
    const [acceptingOrderId, setAcceptingOrderId] = React.useState<string | null>(null);
    const { acceptOrder } = useAcceptOrder();
    const pendingOrders = useSocketStore((state) => state.pendingOrders);

    // Setup new order alert
    useNewOrderAlert({
      onNewOrder: (order) => {
        console.log('[TabsLayout] 🎉 New order detected:', order.orderId);
        
        // Add to queue if not already there
        setOrderQueue((prev) => {
          const exists = prev.some(o => o.orderId === order.orderId);
          if (exists) {
            console.log('[TabsLayout] ℹ️  Order already in queue:', order.orderId);
            return prev;
          }
          console.log('[TabsLayout] 📊 Queue updated - now showing:', order.orderId);
          return [...prev, order];
        });
      },
      onAlert: () => {
        console.log('[TabsLayout] 📳 Alert triggered');
      },
    });

    // Auto-dismiss current toast after 30 seconds
    useEffect(() => {
      if (orderQueue.length > 0) {
        const timer = setTimeout(() => {
          console.log('[TabsLayout] ⏱️ Toast auto-dismissing after 30s');
          handleDismiss();
        }, 30000); // 30 seconds
        return () => clearTimeout(timer);
      }
    }, [orderQueue]);

    const handleDismiss = () => {
      setOrderQueue((prev) => {
        if (prev.length > 0) {
          const remaining = prev.slice(1);
          console.log(`[TabsLayout] 🗑️  Removed order from queue. ${remaining.length} remaining`);
          return remaining;
        }
        return prev;
      });
    };

    const handleAcceptOrder = async (orderId: string) => {
      try {
        setAcceptingOrderId(orderId);
        console.log('[TabsLayout] 🤝 Accepting order:', orderId);
        await acceptOrder(orderId);
        console.log('[TabsLayout] ✅ Order accepted successfully');
        handleDismiss();
      } catch (error) {
        console.error('[TabsLayout] ❌ Failed to accept order:', error);
      } finally {
        setAcceptingOrderId(null);
      }
    };

    const currentToast = orderQueue.length > 0 ? orderQueue[0] : null;

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
        void NavigationBar.setBackgroundColorAsync(Colors.background);
        void NavigationBar.setBorderColorAsync(Colors.border);
        void NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
    }, [isDark, Colors]);

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            {/* ✅ ORDER QUEUE - Shows multiple orders intelligently */}

            <Tabs
            screenOptions={{
                headerShown: false,
                headerStyle: { 
                    backgroundColor: isDark ? Colors.background : Colors.secondary,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.primary + '20',
                },
                headerTintColor: Colors.primary,
                headerTitleStyle: { 
                    color: Colors.primary, 
                    fontFamily: 'brand-bold',
                    fontSize: 18,
                },
                headerTitleAlign: 'center',
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                tabBarStyle: {
                    backgroundColor: Colors.background,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    height: 58 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 6,
                    elevation: 12,
                    shadowColor: isDark ? Colors.secondary : "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
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
            {currentToast && (
              <NewOrderToast
                key={currentToast.orderId}
                orderId={currentToast.orderId}
                customerName={currentToast.customerId}
                itemCount={currentToast.itemCount}
                totalAmount={currentToast.totalAmount}
                paymentMode={currentToast.paymentMode}
                onDismiss={handleDismiss}
                onAccept={handleAcceptOrder}
                isAccepting={acceptingOrderId === currentToast.orderId}
                duration={30000}
                queuePosition={1}
                totalInQueue={orderQueue.length}
              />
            )}
        </View>
    );
}
