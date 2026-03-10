import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "@/constants/colors"
import { FontSize, Fonts } from "@/constants/typography";

const { width } = Dimensions.get("window");

const PERIODS = ["Today", "Week", "Month", "Year"];

const WEEKLY_REVENUE = [3200, 4100, 3700, 5800, 6200, 4900, 3500];
const WEEKLY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_REV = Math.max(...WEEKLY_REVENUE);
const CHART_H = 120;

const TOP_ITEMS = [
    { name: "Grilled Chicken Burger", orders: 142, revenue: "$1,136" },
    { name: "Spicy Prawn Pasta", orders: 98, revenue: "$784" },
    { name: "BBQ Ribs Platter", orders: 76, revenue: "$1,140" },
    { name: "Caesar Salad", orders: 65, revenue: "$390" },
    { name: "Lava Chocolate Cake", orders: 55, revenue: "$220" },
];

export default function StatsScreen() {
    const [activePeriod, setActivePeriod] = useState("Week");

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* KPI Cards */}
                <View style={styles.kpiRow}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Revenue</Text>
                        <Text style={styles.kpiValue}>$31,400</Text>
                        <View style={styles.kpiChange}>
                            <Ionicons name="trending-up" size={12} color={Colors.success} />
                            <Text style={[styles.kpiChangeText, { color: Colors.success }]}>
                                +12.4%
                            </Text>
                        </View>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Orders</Text>
                        <Text style={styles.kpiValue}>486</Text>
                        <View style={styles.kpiChange}>
                            <Ionicons name="trending-up" size={12} color={Colors.success} />
                            <Text style={[styles.kpiChangeText, { color: Colors.success }]}>
                                +8.1%
                            </Text>
                        </View>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Avg Order</Text>
                        <Text style={styles.kpiValue}>$64.6</Text>
                        <View style={styles.kpiChange}>
                            <Ionicons name="trending-down" size={12} color={Colors.danger} />
                            <Text style={[styles.kpiChangeText, { color: Colors.danger }]}>
                                -2.3%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Revenue Chart */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Revenue This Week</Text>
                        <Text style={styles.cardSubtitle}>$31,400 total</Text>
                    </View>
                    <View style={styles.barChart}>
                        {WEEKLY_REVENUE.map((val, i) => {
                            const h = (val / MAX_REV) * CHART_H;
                            const isToday = i === 4;
                            return (
                                <View key={i} style={styles.barCol}>
                                    <Text style={styles.barValue}>
                                        {isToday ? `$${(val / 1000).toFixed(1)}k` : ""}
                                    </Text>
                                    <View
                                        style={[
                                            styles.chartBar,
                                            {
                                                height: h,
                                                backgroundColor: isToday
                                                    ? Colors.primary
                                                    : "#D4A96A",
                                            },
                                        ]}
                                    />
                                    <Text style={styles.barDay}>{WEEKLY_DAYS[i]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Order Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Order Breakdown</Text>
                    <View style={styles.breakdownGrid}>
                        {[
                            { label: "Delivery", pct: 64, icon: "bicycle-outline" as const, color: Colors.primary },
                            { label: "Dine-In", pct: 28, icon: "restaurant-outline" as const, color: Colors.primary },
                            { label: "Takeaway", pct: 8, icon: "bag-handle-outline" as const, color: Colors.warning },
                        ].map((item) => (
                            <View key={item.label} style={styles.breakdownItem}>
                                <View style={[styles.breakdownIcon, { backgroundColor: item.color + "22" }]}>
                                    <Ionicons name={item.icon} size={20} color={item.color} />
                                </View>
                                <Text style={styles.breakdownPct}>{item.pct}%</Text>
                                <Text style={styles.breakdownLabel}>{item.label}</Text>
                                <View style={styles.breakdownBar}>
                                    <View
                                        style={[
                                            styles.breakdownFill,
                                            { width: `${item.pct}%` as any, backgroundColor: item.color },
                                        ]}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Items */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Top Selling Items</Text>
                    {TOP_ITEMS.map((item, i) => (
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
                            <Text style={styles.topItemRevenue}>{item.revenue}</Text>
                        </View>
                    ))}
                </View>

                {/* Rating Overview */}
                <View style={[styles.card, { marginBottom: 0 }]}>
                    <Text style={styles.cardTitle}>Customer Rating</Text>
                    <View style={styles.ratingRow}>
                        <View style={styles.ratingBig}>
                            <Text style={styles.ratingScore}>4.8</Text>
                            <View style={styles.stars}>
                                {[1,2,3,4,5].map(s => (
                                    <Ionicons
                                        key={s}
                                        name={s <= 4 ? "star" : "star-half"}
                                        size={18}
                                        color={Colors.primary}
                                    />
                                ))}
                            </View>
                            <Text style={styles.ratingCount}>142 reviews</Text>
                        </View>
                        <View style={styles.ratingBars}>
                            {[
                                { stars: 5, pct: 72 },
                                { stars: 4, pct: 18 },
                                { stars: 3, pct: 6 },
                                { stars: 2, pct: 3 },
                                { stars: 1, pct: 1 },
                            ].map((r) => (
                                <View key={r.stars} style={styles.ratingBarRow}>
                                    <Text style={styles.ratingBarLabel}>{r.stars}★</Text>
                                    <View style={styles.ratingBarTrack}>
                                        <View
                                            style={[
                                                styles.ratingBarFill,
                                                { width: `${r.pct}%` as any },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.ratingBarPct}>{r.pct}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 16,
    },
    headerTitle: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.xxl,
        color: Colors.text,
    },
    exportBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    exportText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
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
        height: CHART_H + 40,
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
});
