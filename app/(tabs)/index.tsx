import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React, { useRef, useState } from "react";
import { usePartnerStore } from "@/store/usePartner";
import {
    Animated,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { authClient } from "@/lib/auth-client";
import { PartnerWelcomeScreen } from "@/components/PartnerWelcomeScreen";
import { useMyRestaurantApplication } from "@/hooks/useRestaurantPartnerRequest";
import { ApplicationStatusScreen } from "@/components/ApplicationStatusScreen";
import { AppUser } from "@/types/user";


const BAR_DATA = [
    { day: "Mon", value: 0.45 },
    { day: "Tue", value: 0.6 },
    { day: "Wed", value: 0.55 },
    { day: "Thu", value: 0.8 },
    { day: "Fri", value: 0.95 },
    { day: "Sat", value: 0.75 },
    { day: "Sun", value: 0.5 },
];

const CHART_HEIGHT = 110;

export default function HomeScreen() {
    const { appliedForPartner, _hasHydrated } = usePartnerStore();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { data: session } = authClient.useSession();
    const user = session?.user as AppUser | undefined;
    const { data: application, isLoading: applicationLoading } = useMyRestaurantApplication();
    console.log(application);


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
            ])
        ).start();
    }, []);

    // Wait for SecureStore hydration before reading persisted state
    if (!_hasHydrated) return null;
    if (session && user?.role !== "RESTAURANT_MANAGER" && !appliedForPartner) {
        return (
            <>
                <Tabs.Screen options={{ tabBarStyle: { display: "none" } }} />
                <PartnerWelcomeScreen />
            </>
        );
    }
    else if (appliedForPartner) {

        return (
            <>
                <Tabs.Screen options={{ tabBarStyle: { display: "none" } }} />
                <ApplicationStatusScreen
                    application={application}
                    isLoading={applicationLoading}
                />
            </>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Ionicons name="storefront" size={22} color={Colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.restaurantName}>{application?.restaurantName}</Text>
                        <Text style={styles.headerSubtitle}>MANAGER DASHBOARD</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIconBtn}>
                        <Ionicons name="notifications-outline" size={22} color={Colors.text} />
                        <View style={styles.notiBadge} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIconBtn}>
                        <Ionicons name="person-circle-outline" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Today's Performance */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Performance</Text>
                    <View style={styles.liveBadge}>
                        <Animated.View
                            style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}
                        />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    {/* Total Sales */}
                    <View style={[styles.statCard, styles.statCardPrimary]}>
                        <View style={styles.statCardHeader}>
                            <Ionicons name="cash-outline" size={16} color={Colors.primary} />
                            <Text style={styles.statLabel}>Total Sales</Text>
                        </View>
                        <Text style={styles.statValue}>$1,245.50</Text>
                        <View style={styles.statChange}>
                            <Ionicons name="trending-up" size={14} color={Colors.success} />
                            <Text style={styles.statChangeText}>+15% vs yesterday</Text>
                        </View>
                    </View>

                    {/* Active Orders */}
                    <View style={[styles.statCard, styles.statCardSecondary]}>
                        <View style={styles.statCardHeader}>
                            <Ionicons name="receipt-outline" size={16} color={Colors.muted} />
                            <Text style={styles.statLabelMuted}>Active Orders</Text>
                        </View>
                        <Text style={styles.statValue}>12</Text>
                        <View style={styles.statChange}>
                            <Ionicons name="add-circle-outline" size={14} color={Colors.primary} />
                            <Text style={styles.statChangeTextAmber}>+2 just now</Text>
                        </View>
                    </View>
                </View>

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

                {/* Revenue Trend Chart */}
                <View style={styles.chartSection}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Revenue Trend</Text>
                        <TouchableOpacity>
                            <Text style={styles.chartLink}>View Full Report</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.chartContainer}>
                        {BAR_DATA.map((item, index) => {
                            const isToday = index === 4;
                            return (
                                <View key={item.day} style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: CHART_HEIGHT * item.value,
                                                backgroundColor: isToday
                                                    ? Colors.primary
                                                    : "#D4A96A",
                                                borderRadius: 6,
                                            },
                                        ]}
                                    />
                                    <Text style={styles.barLabel}>{item.day}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* New Delivery Order Banner */}
                <View style={styles.orderBanner}>
                    <View style={styles.orderBannerIcon}>
                        <Ionicons name="bag-handle" size={22} color="#FFF" />
                    </View>
                    <View style={styles.orderBannerInfo}>
                        <Text style={styles.orderBannerTitle}>New Delivery Order</Text>
                        <Text style={styles.orderBannerSub}>Order #8492 · 3 items ($42.00)</Text>
                    </View>
                    <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.85}>
                        <Text style={styles.acceptBtnText}>ACCEPT{"\n"}NOW</Text>
                    </TouchableOpacity>
                </View>

                {/* Second metric row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, styles.statCardSecondary]}>
                        <View style={styles.statCardHeader}>
                            <Ionicons name="time-outline" size={16} color={Colors.muted} />
                            <Text style={styles.statLabelMuted}>Avg Wait Time</Text>
                        </View>
                        <Text style={styles.statValue}>18 min</Text>
                        <View style={styles.statChange}>
                            <Ionicons name="trending-down" size={14} color={Colors.success} />
                            <Text style={styles.statChangeText}>-3min improved</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, styles.statCardSecondary]}>
                        <View style={styles.statCardHeader}>
                            <Ionicons name="star-outline" size={16} color={Colors.muted} />
                            <Text style={styles.statLabelMuted}>Rating</Text>
                        </View>
                        <Text style={styles.statValue}>4.8 ⭐</Text>
                        <View style={styles.statChange}>
                            <Ionicons name="people-outline" size={14} color={Colors.primary} />
                            <Text style={styles.statChangeTextAmber}>142 reviews</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 16,
        backgroundColor: Colors.primary,
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
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: Colors.primary + "55",
    },
    restaurantName: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.white,
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontFamily: Fonts.brand,
        fontSize: 10,
        color: Colors.white,
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
        backgroundColor: Colors.surface,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    notiBadge: {
        position: "absolute",
        top: 8,
        right: 9,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        borderWidth: 1.5,
        borderColor: Colors.background,
    },
    scrollContent: {
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 24,
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
        borderWidth: 1,
        borderColor: Colors.border,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    liveText: {
        fontFamily: Fonts.brandBold,
        fontSize: 11,
        color: Colors.primary,
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
    },
    statCardPrimary: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statCardSecondary: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
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
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    quickActionText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
        lineHeight: 22,
    },
    chartSection: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    chartTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.lg,
        color: Colors.text,
    },
    chartLink: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    chartContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: CHART_HEIGHT + 24,
        paddingBottom: 24,
    },
    barWrapper: {
        alignItems: "center",
        flex: 1,
        justifyContent: "flex-end",
        gap: 6,
    },
    bar: {
        width: "65%",
    },
    barLabel: {
        fontFamily: Fonts.brand,
        fontSize: 10,
        color: Colors.muted,
    },
    orderBanner: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
    },
    orderBannerIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.12)",
        justifyContent: "center",
        alignItems: "center",
    },
    orderBannerInfo: {
        flex: 1,
    },
    orderBannerTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.white,
    },
    orderBannerSub: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.primaryLight,
        marginTop: 2,
    },
    acceptBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: "center",
    },
    acceptBtnText: {
        fontFamily: Fonts.brandBold,
        fontSize: 11,
        color: Colors.white,
        textAlign: "center",
        lineHeight: 15,
        letterSpacing: 0.5,
    },
});


