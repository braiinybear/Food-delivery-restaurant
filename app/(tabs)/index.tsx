import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React, { useCallback, useRef, useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePartnerStore } from "@/store/usePartner";
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeType } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { authClient } from "@/lib/auth-client";
import { PartnerWelcomeScreen } from "@/components/PartnerWelcomeScreen";
import {
  useMyRestaurantApplication,
  useRestaurantDashboard,
} from "@/hooks/useRestaurantPartnerRequest";
import { ApplicationStatusScreen } from "@/components/ApplicationStatusScreen";
import { AppUser } from "@/types/user";
import { useTheme } from "@/context/ThemeContext";


export default function HomeScreen() {
  const { Colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { appliedForPartner, _hasHydrated } = usePartnerStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { data: session } = authClient.useSession();
  const user = session?.user as AppUser | undefined;
  const { data: application, isLoading: applicationLoading, refetch: refetchApplication } =
    useMyRestaurantApplication();
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } =
    useRestaurantDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(Colors, isDark, insets), [Colors, isDark, insets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchDashboard();
    setRefreshing(false);
  }, [refetchDashboard]);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  // Wait for SecureStore hydration before reading persisted state
  if (!_hasHydrated) return null;

  const isPartner = user?.role === "RESTAURANT_MANAGER" || user?.role === "ADMIN" || application?.status === 'APPROVED';

  if (session && !isPartner && !appliedForPartner) {
    return (
      <>
        <PartnerWelcomeScreen />
      </>
    );
  } else if (appliedForPartner) {
    return (
      <>
        <ApplicationStatusScreen 
          application={application}
          isLoading={applicationLoading}
          onRefresh={async () => {
            await refetchApplication();
          }}
        />
      </>
    );
  }

  // If applied but approved, or already a partner, show dashboard

  // Show tabbar for approved home screen
  return (
    <View style={styles.container}>
     <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? Colors.background : Colors.secondary} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Ionicons name="storefront" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.restaurantName}>
              {dashboard?.restaurantName ?? application?.restaurantName}
            </Text>
            <Text style={styles.headerSubtitle}>MANAGER DASHBOARD</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.white}
            />
            <View style={styles.notiBadge} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/restaurantProfile")}
            style={styles.headerIconBtn}
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: Colors.background }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Today's Performance */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Performance</Text>
          <View style={styles.liveBadge}>
            <Animated.View
              style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}
            />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {dashboardLoading ? (
          <View style={styles.dashboardLoader}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.dashboardLoaderText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              {/* Revenue */}
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <View style={styles.statCardHeader}>
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <Text style={styles.statValue}>
                  ₹{dashboard?.metrics.revenue?.toLocaleString() ?? "0"}
                </Text>
                <View style={styles.statChange}>
                  <Ionicons
                    name="receipt-outline"
                    size={14}
                    color={Colors.success}
                  />
                  <Text style={styles.statChangeText}>
                    {dashboard?.metrics.completedOrders ?? 0} completed
                  </Text>
                </View>
              </View>

              {/* Active Orders */}
              <View style={[styles.statCard, styles.statCardSecondary]}>
                <View style={styles.statCardHeader}>
                  <Ionicons
                    name="receipt-outline"
                    size={16}
                    color={Colors.muted}
                  />
                  <Text style={styles.statLabelMuted}>Active Orders</Text>
                </View>
                <Text style={styles.statValue}>
                  {dashboard?.metrics.activeOrders ?? 0}
                </Text>
                <View style={styles.statChange}>
                  <Ionicons
                    name="bag-check-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.statChangeTextAmber}>
                    {dashboard?.metrics.totalOrders ?? 0} total
                  </Text>
                </View>
              </View>
            </View>

            {/* Orders Breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Orders Overview</Text>
              {dashboard?.period && (
                <Text style={styles.breakdownPeriod}>
                  {new Date(dashboard.period.start).toLocaleDateString(
                    "en-IN",
                    { month: "short", day: "numeric" },
                  )}{" "}
                  –{" "}
                  {new Date(dashboard.period.end).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              )}
              <View style={styles.breakdownRow}>
                <BreakdownItem
                  icon="layers-outline"
                  label="Total"
                  value={dashboard?.metrics.totalOrders ?? 0}
                  color={Colors.primary}
                />
                <BreakdownItem
                  icon="checkmark-circle-outline"
                  label="Completed"
                  value={dashboard?.metrics.completedOrders ?? 0}
                  color={Colors.success}
                />
                <BreakdownItem
                  icon="flame-outline"
                  label="Active"
                  value={dashboard?.metrics.activeOrders ?? 0}
                  color={Colors.secondary}
                />
                <BreakdownItem
                  icon="close-circle-outline"
                  label="Cancelled"
                  value={dashboard?.metrics.cancelledOrders ?? 0}
                  color={Colors.danger}
                />
              </View>
            </View>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.quickActionsLabel}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/(tabs)/menu")}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="restaurant" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Manage{"\n"}Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/(tabs)/orders")}
            activeOpacity={0.75}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="list" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>View Orders</Text>
          </TouchableOpacity>
        </View>

       
      
      </ScrollView>
    </View>
  );
}

// ─── Breakdown Item ──────────────────────────────────────────────────────────
function BreakdownItem({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  const { Colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(Colors, isDark, insets), [Colors, isDark, insets]);
  return (
    <View style={styles.breakdownItem}>
      <View
        style={[styles.breakdownIcon, { backgroundColor: color + "18" }]}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.breakdownValue, { color: Colors.text }]}>{value}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (Colors: ThemeType, isDark: boolean, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? insets.top : Math.max(insets.top, 20),
    paddingBottom: 20,
    backgroundColor: isDark ? Colors.background : Colors.secondary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantName: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: isDark ? Colors.text : Colors.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontFamily: Fonts.brand,
    fontSize: 10,
    color: isDark ? Colors.muted : "rgba(255,255,255,0.9)",
    letterSpacing: 1.5,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? Colors.background : "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notiBadge: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    borderWidth: 1.5,
    borderColor: isDark ? Colors.surface : Colors.primary,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  liveText: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.danger,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardPrimary: {
    borderColor: Colors.primary + "33",
  },
  statCardSecondary: {
    borderColor: Colors.border,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  statLabel: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  statLabelMuted: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  statValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: FontSize.xxl,
    color: Colors.text,
    marginBottom: 8,
  },
  statChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statChangeText: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  statChangeTextAmber: {
    fontFamily: Fonts.brandMedium,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  quickActionsLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  dashboardLoader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  dashboardLoaderText: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginTop: 10,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  breakdownTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.lg,
    color: Colors.text,
    marginBottom: 2,
  },
  breakdownPeriod: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  breakdownIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  breakdownValue: {
    fontFamily: Fonts.brandBold,
    fontSize: FontSize.xl,
    color: Colors.text,
  },
  breakdownLabel: {
    fontFamily: Fonts.brand,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
});
