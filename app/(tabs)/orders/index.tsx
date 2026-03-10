import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MOCK_ORDERS = [
    { id: "#8492", items: "Grilled Burger × 2, Fries × 1", total: "$42.00", status: "New", time: "2 min ago", statusColor: Colors.primary },
    { id: "#8491", items: "Spicy Pasta × 1", total: "$16.00", status: "Preparing", time: "12 min ago", statusColor: Colors.warning },
    { id: "#8490", items: "BBQ Ribs × 1, Salad × 2", total: "$64.50", status: "Ready", time: "22 min ago", statusColor: Colors.success },
    { id: "#8489", items: "Lava Cake × 3", total: "$24.00", status: "Delivered", time: "45 min ago", statusColor: Colors.muted },
    { id: "#8488", items: "Caesar Salad × 2, Water × 2", total: "$18.00", status: "Delivered", time: "1 hr ago", statusColor: Colors.muted },
];

const STATUS_TABS = ["All", "New", "Preparing", "Ready", "Delivered"];

export default function OrdersScreen() {
    const [activeTab, setActiveTab] = React.useState("All");

    const filtered = activeTab === "All"
        ? MOCK_ORDERS
        : MOCK_ORDERS.filter(o => o.status === activeTab);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            {/* Badge + Filter Row */}
            <View style={styles.topBar}>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                        {MOCK_ORDERS.filter(o => o.status === "New").length} New
                    </Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScroll}
                contentContainerStyle={styles.tabsContent}
            >
                {STATUS_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                style={styles.contentScroll}
            >
                {filtered.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>{order.id}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: order.statusColor + "22" }]}>
                                <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.orderItems}>{order.items}</Text>
                        <View style={styles.orderFooter}>
                            <View style={styles.orderTime}>
                                <Ionicons name="time-outline" size={13} color={Colors.muted} />
                                <Text style={styles.orderTimeText}>{order.time}</Text>
                            </View>
                            <Text style={styles.orderTotal}>{order.total}</Text>
                        </View>
                        {order.status === "New" && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.rejectBtn}>
                                    <Text style={styles.rejectBtnText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.acceptOrderBtn}>
                                    <Text style={styles.acceptOrderBtnText}>Accept Order</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
    },
    countBadge: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
    countText: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.white },
    tabsScroll: {
        height: 48, flexGrow: 0,
        maxHeight: 60,
        marginBottom: 10,
    },
    tabsContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tab: {
        height: 36,
        marginVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    tabActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    tabText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.muted,
    },
    tabTextActive: {
        color: Colors.white,
    },
    content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12, paddingTop: 10 },
    contentScroll: { flex: 1 },
    orderCard: {
        backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    orderId: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.text },
    statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontFamily: Fonts.brandBold, fontSize: 11 },
    orderItems: { fontFamily: Fonts.brand, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 12 },
    orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    orderTime: { flexDirection: "row", alignItems: "center", gap: 4 },
    orderTimeText: { fontFamily: Fonts.brand, fontSize: FontSize.xs, color: Colors.muted },
    orderTotal: { fontFamily: Fonts.brandBold, fontSize: FontSize.md, color: Colors.primary },
    actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
    rejectBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 12,
        borderWidth: 1, borderColor: Colors.danger + "55", alignItems: "center",
    },
    rejectBtnText: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.danger },
    acceptOrderBtn: {
        flex: 2, paddingVertical: 10, borderRadius: 12,
        backgroundColor: Colors.primary, alignItems: "center",
    },
    acceptOrderBtnText: { fontFamily: Fonts.brandBold, fontSize: FontSize.sm, color: Colors.white },
});
