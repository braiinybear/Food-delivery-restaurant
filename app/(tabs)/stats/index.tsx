import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { useRestaurantStats, StatsPeriod } from "@/hooks/useRestaurantStats";

const { width } = Dimensions.get("window");

const PERIODS: StatsPeriod[] = ["Today", "Week", "Month", "Year"];

const PAYMENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    UPI: "phone-portrait-outline",
    CARD: "card-outline",
    COD: "cash-outline",
    WALLET: "wallet-outline",
    NETBANKING: "globe-outline",
    RAZORPAY: "logo-usd",
};

const PAYMENT_COLORS: Record<string, string> = {
    UPI: "#6C5CE7",
    CARD: "#0984E3",
    COD: Colors.success,
    WALLET: Colors.warning,
    NETBANKING: Colors.primary,
    RAZORPAY: "#E74C3C",
};

export default function StatsScreen() {
    const [activePeriod, setActivePeriod] = useState<StatsPeriod>("Week");
    const { data: stats, isLoading, refetch, isRefetching } = useRestaurantStats(activePeriod);

    const chartData = stats?.chartData || [];
    const maxChartValue = Math.max(...chartData.map(d => d.value), 1);
    const CHART_H = 120;

    const formatCurrency = (v: number) => {
        if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
        if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
        return `₹${v.toFixed(0)}`;
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ fontFamily: Fonts.brandMedium, color: Colors.muted, marginTop: 12 }}>
                    Loading stats…
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            {/* Period Tabs */}
            <View style={styles.periodRow}>
                {PERIODS.map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodTab, activePeriod === p && styles.periodTabActive]}
                        onPress={() => setActivePeriod(p)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.periodTabText,
                                activePeriod === p && styles.periodTabTextActive,
                            ]}
                        >
                            {p}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
                }
            >
                {/* KPI Cards */}
                {stats?.kpis && (
                    <View style={styles.kpiRow}>
                        {/* Revenue */}
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Revenue</Text>
                            <Text style={styles.kpiValue}>{formatCurrency(stats.kpis.revenue.value)}</Text>
                            <View style={styles.kpiChange}>
                                <Ionicons
                                    name={stats.kpis.revenue.change >= 0 ? "trending-up" : "trending-down"}
                                    size={12}
                                    color={stats.kpis.revenue.change >= 0 ? Colors.success : Colors.danger}
                                />
                                <Text style={[styles.kpiChangeText, {
                                    color: stats.kpis.revenue.change >= 0 ? Colors.success : Colors.danger
                                }]}>
                                    {stats.kpis.revenue.change >= 0 ? "+" : ""}{stats.kpis.revenue.change}%
                                </Text>
                            </View>
                        </View>
                        {/* Orders */}
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Orders</Text>
                            <Text style={styles.kpiValue}>{stats.kpis.orders.value}</Text>
                            <View style={styles.kpiChange}>
                                <Ionicons
                                    name={stats.kpis.orders.change >= 0 ? "trending-up" : "trending-down"}
                                    size={12}
                                    color={stats.kpis.orders.change >= 0 ? Colors.success : Colors.danger}
                                />
                                <Text style={[styles.kpiChangeText, {
                                    color: stats.kpis.orders.change >= 0 ? Colors.success : Colors.danger
                                }]}>
                                    {stats.kpis.orders.change >= 0 ? "+" : ""}{stats.kpis.orders.change}%
                                </Text>
                            </View>
                        </View>
                        {/* AOV */}
                        <View style={styles.kpiCard}>
                            <Text style={styles.kpiLabel}>Avg Order</Text>
                            <Text style={styles.kpiValue}>{formatCurrency(stats.kpis.aov.value)}</Text>
                            <View style={styles.kpiChange}>
                                <Ionicons
                                    name={stats.kpis.aov.change >= 0 ? "trending-up" : "trending-down"}
                                    size={12}
                                    color={stats.kpis.aov.change >= 0 ? Colors.success : Colors.danger}
                                />
                                <Text style={[styles.kpiChangeText, {
                                    color: stats.kpis.aov.change >= 0 ? Colors.success : Colors.danger
                                }]}>
                                    {stats.kpis.aov.change >= 0 ? "+" : ""}{stats.kpis.aov.change}%
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Revenue Chart */}
                {chartData.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Revenue</Text>
                            <Text style={styles.cardSubtitle}>
                                {formatCurrency(chartData.reduce((s, d) => s + d.value, 0))} total
                            </Text>
                        </View>
                        <View style={styles.barChart}>
                            {chartData.map((point, i) => {
                                const h = (point.value / maxChartValue) * CHART_H;
                                const isHighest = point.value === maxChartValue;
                                return (
                                    <View key={i} style={styles.barCol}>
                                        <Text style={styles.barValue}>
                                            {isHighest ? formatCurrency(point.value) : ""}
                                        </Text>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                {
                                                    height: Math.max(h, 4),
                                                    backgroundColor: isHighest
                                                        ? Colors.primary
                                                        : "#D4A96A",
                                                },
                                            ]}
                                        />
                                        <Text style={styles.barDay}>{point.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {chartData.length === 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Revenue</Text>
                        <View style={styles.emptyState}>
                            <Ionicons name="bar-chart-outline" size={40} color={Colors.muted} />
                            <Text style={styles.emptyText}>No revenue data for this period</Text>
                        </View>
                    </View>
                )}

                {/* Payment Mode Breakdown */}
                {stats?.paymentBreakdown && stats.paymentBreakdown.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Payment Modes</Text>
                        <View style={styles.breakdownGrid}>
                            {stats.paymentBreakdown.map((item) => (
                                <View key={item.label} style={styles.breakdownItem}>
                                    <View style={[
                                        styles.breakdownIcon,
                                        { backgroundColor: (PAYMENT_COLORS[item.label] || Colors.primary) + "22" }
                                    ]}>
                                        <Ionicons
                                            name={PAYMENT_ICONS[item.label] || "ellipse-outline"}
                                            size={20}
                                            color={PAYMENT_COLORS[item.label] || Colors.primary}
                                        />
                                    </View>
                                    <Text style={styles.breakdownPct}>{item.percentage}%</Text>
                                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                                    <View style={styles.breakdownBar}>
                                        <View
                                            style={[
                                                styles.breakdownFill,
                                                {
                                                    width: `${item.percentage}%` as any,
                                                    backgroundColor: PAYMENT_COLORS[item.label] || Colors.primary,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Top Items */}
                {stats?.topItems && stats.topItems.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Top Selling Items</Text>
                        {stats.topItems.map((item, i) => (
                            <View key={item.name} style={styles.topItem}>
                                <View style={styles.topItemRank}>
                                    <Text style={styles.topItemRankText}>{i + 1}</Text>
                                </View>
                                <View style={styles.topItemInfo}>
                                    <Text style={styles.topItemName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.topItemOrders}>{item.orders} orders</Text>
                                </View>
                                <Text style={styles.topItemRevenue}>{formatCurrency(item.revenue)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {stats?.topItems && stats.topItems.length === 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Top Selling Items</Text>
                        <View style={styles.emptyState}>
                            <Ionicons name="fast-food-outline" size={40} color={Colors.muted} />
                            <Text style={styles.emptyText}>No sales data for this period</Text>
                        </View>
                    </View>
                )}

                {/* Rating Overview */}
                {stats?.ratings && stats.ratings.count > 0 && (
                    <View style={[styles.card, { marginBottom: 0 }]}>
                        <Text style={styles.cardTitle}>Customer Rating</Text>
                        <View style={styles.ratingRow}>
                            <View style={styles.ratingBig}>
                                <Text style={styles.ratingScore}>{stats.ratings.average}</Text>
                                <View style={styles.stars}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Ionicons
                                            key={s}
                                            name={
                                                s <= Math.floor(stats.ratings.average)
                                                    ? "star"
                                                    : s <= Math.ceil(stats.ratings.average)
                                                        ? "star-half"
                                                        : "star-outline"
                                            }
                                            size={18}
                                            color={Colors.primary}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.ratingCount}>{stats.ratings.count} reviews</Text>
                            </View>
                            <View style={styles.ratingBars}>
                                {stats.ratings.breakdown.map((r) => (
                                    <View key={r.stars} style={styles.ratingBarRow}>
                                        <Text style={styles.ratingBarLabel}>{r.stars}★</Text>
                                        <View style={styles.ratingBarTrack}>
                                            <View
                                                style={[
                                                    styles.ratingBarFill,
                                                    { width: `${r.percentage}%` as any },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.ratingBarPct}>{r.percentage}%</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {stats?.ratings && stats.ratings.count === 0 && (
                    <View style={[styles.card, { marginBottom: 0 }]}>
                        <Text style={styles.cardTitle}>Customer Rating</Text>
                        <View style={styles.emptyState}>
                            <Ionicons name="star-outline" size={40} color={Colors.muted} />
                            <Text style={styles.emptyText}>No reviews yet</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    periodRow: {
        marginTop: 20,
        flexDirection: "row",
        marginHorizontal: 16,
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: "center",
    },
    periodTabActive: { backgroundColor: Colors.primary },
    periodTabText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
    periodTabTextActive: { color: Colors.white, fontFamily: Fonts.brandBold },
    content: { paddingHorizontal: 16, paddingBottom: 24 },
    kpiRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    kpiCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    kpiLabel: { fontFamily: Fonts.brand, fontSize: 11, color: Colors.muted, marginBottom: 6 },
    kpiValue: { fontFamily: Fonts.brandBlack, fontSize: FontSize.xl, color: Colors.text },
    kpiChange: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    kpiChangeText: { fontFamily: Fonts.brandMedium, fontSize: 11 },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    cardTitle: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.text, marginBottom: 16 },
    cardSubtitle: { fontFamily: Fonts.brandMedium, fontSize: FontSize.sm, color: Colors.primary },
    barChart: {
        flexDirection: "row",
        alignItems: "flex-end",
        height: 160,
        gap: 4,
        paddingBottom: 24,
    },
    barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
    barValue: { fontFamily: Fonts.brand, fontSize: 9, color: Colors.primary },
    chartBar: { width: "70%", borderRadius: 5 },
    barDay: { fontFamily: Fonts.brand, fontSize: 10, color: Colors.muted },
    breakdownGrid: { gap: 14 },
    breakdownItem: { gap: 6 },
    breakdownIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    breakdownPct: { fontFamily: Fonts.brandBlack, fontSize: FontSize.xl, color: Colors.text },
    breakdownLabel: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted },
    breakdownBar: { height: 6, backgroundColor: Colors.light, borderRadius: 3 },
    breakdownFill: { height: 6, borderRadius: 3 },
    topItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    topItemRank: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: Colors.light,
        justifyContent: "center",
        alignItems: "center",
    },
    topItemRankText: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.primary },
    topItemInfo: { flex: 1 },
    topItemName: { fontFamily: Fonts.brandMedium, fontSize: FontSize.sm, color: Colors.text },
    topItemOrders: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
    topItemRevenue: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.primary },
    ratingRow: { flexDirection: "row", gap: 16 },
    ratingBig: { alignItems: "center", justifyContent: "center", gap: 4 },
    ratingScore: { fontFamily: Fonts.brandBlack, fontSize: 44, color: Colors.primary },
    stars: { flexDirection: "row", gap: 2 },
    ratingCount: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted },
    ratingBars: { flex: 1, gap: 6, justifyContent: "center" },
    ratingBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    ratingBarLabel: { fontFamily: Fonts.brand, fontSize: 11, color: Colors.muted, width: 24 },
    ratingBarTrack: { flex: 1, height: 6, backgroundColor: Colors.light, borderRadius: 3 },
    ratingBarFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
    ratingBarPct: { fontFamily: Fonts.brand, fontSize: 10, color: Colors.muted, width: 28, textAlign: "right" },
    emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
    emptyText: { fontFamily: Fonts.brand, fontSize: FontSize.sm, color: Colors.muted },
});
