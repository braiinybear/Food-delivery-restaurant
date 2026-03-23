import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { useRestaurantOrders, useUpdateOrderStatus, getAllowedTransitions } from "@/hooks/useOrders";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native";
import { OrderStatus } from "@/types/order";

const STATUS_TABS = ["All", "PLACED", "ACCEPTED", "PREPARING", "READY", "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED", "REFUSED"];

const getStatusColor = (status: string): string => {
    switch (status) {
        case "PLACED":
            return Colors.primary;
        case "ACCEPTED":
            return Colors.warning;
        case "PREPARING":
            return Colors.warning;
        case "READY":
            return Colors.warning;
        case "PICKED_UP":
            return Colors.warning;
        case "ON_THE_WAY":
            return Colors.warning;
        case "DELIVERED":
            return Colors.success;
        case "CANCELLED":
            return Colors.danger;
        case "REFUSED":
            return Colors.danger;
        default:
            return Colors.muted;
    }
};

const getStatusLabel = (status: string): string => {
    switch (status) {
        case "PLACED":
            return "New";
        case "ACCEPTED":
            return "Accepted";
        case "PREPARING":
            return "Preparing";
        case "READY":
            return "Ready";
        case "PICKED_UP":
            return "Picked Up";
        case "ON_THE_WAY":
            return "On The Way";
        case "DELIVERED":
            return "Delivered";
        case "CANCELLED":
            return "Cancelled";
        case "REFUSED":
            return "Refused";
        default:
            return status;
    }
};

const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return orderDate.toLocaleDateString();
};

const formatItemsList = (items: any[]): string => {
    if (!items || items.length === 0) return "No items";
    return items.map(item => `${item.menuItem?.name || "Item"} × ${item.quantity}`).join(", ");
};

export default function OrdersScreen() {
    const { data: orders, isLoading, refetch } = useRestaurantOrders();
    const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
    
    const [activeTab, setActiveTab] = React.useState("All");
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [openMenuOrderId, setOpenMenuOrderId] = React.useState<string | null>(null);

    const handleRefresh = React.useCallback(async () => {
        setIsRefreshing(true);
        try {
            if (refetch) {
                await refetch();
            }
        } catch (error) {
            console.error("Error refreshing orders:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetch]);

    const filtered = activeTab === "All"
        ? orders || []
        : (orders || []).filter(o => o.status === activeTab);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            {/* Badge + Filter Row */}
            <View style={styles.topBar}>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                        {(orders || []).filter(o => o.status === "PLACED").length} New
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

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={48} color={Colors.muted} />
                    <Text style={styles.emptyText}>No orders found</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    style={styles.contentScroll}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                            progressBackgroundColor={Colors.white}
                            progressViewOffset={0}
                        />
                    }
                >
                    {filtered.map((order) => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <View>
                                    <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                                    <Text style={styles.customerName}>{order.customer?.name || "Customer"}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "22" }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{getStatusLabel(order.status)}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Items Section */}
                            <View style={styles.itemsSection}>
                                <Text style={styles.sectionLabel}>Items</Text>
                                <Text style={styles.orderItems} numberOfLines={2}>
                                    {formatItemsList(order.items)}
                                </Text>
                            </View>

                            {/* Order Details Grid */}
                            <View style={styles.detailsGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Item Total</Text>
                                    <Text style={styles.detailValue}>₹{order.itemTotal?.toFixed(2)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Delivery</Text>
                                    <Text style={styles.detailValue}>₹{order.deliveryCharge?.toFixed(2)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Tax</Text>
                                    <Text style={styles.detailValue}>₹{order.tax?.toFixed(2)}</Text>
                                </View>
                            </View>

                            {/* Total Amount */}
                            <View style={styles.totalSection}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalAmount}>₹{order.totalAmount?.toFixed(2)}</Text>
                            </View>

                            {/* Order Information */}
                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="time-outline" size={14} color={Colors.muted} />
                                    <Text style={styles.infoText}>{formatTimeAgo(order.placedAt)}</Text>
                                </View>
                                {order.otp && (
                                    <View style={styles.infoItem}>
                                        <Ionicons name="key-outline" size={14} color={Colors.muted} />
                                        <Text style={styles.infoText}>OTP: {order.otp}</Text>
                                    </View>
                                )}
                                <View style={styles.infoItem}>
                                    <Ionicons name={order.isPaid ? "checkmark-circle" : "close-circle"} size={14} color={order.isPaid ? Colors.success : Colors.danger} />
                                    <Text style={[styles.infoText, { color: order.isPaid ? Colors.success : Colors.danger }]}>
                                        {order.isPaid ? "Paid" : "Unpaid"}
                                    </Text>
                                </View>
                            </View>

                            {/* Payment Mode */}
                            <View style={styles.paymentMode}>
                                <Text style={styles.paymentModeLabel}>
                                    Payment: <Text style={styles.paymentModeValue}>{order.paymentMode}</Text>
                                </Text>
                            </View>

                            {/* Status Update Actions with Dropdown */}
                            <View style={styles.actionRow}>
                                {/* Status Dropdown */}
                                <View style={styles.dropdownContainer}>
                                    <TouchableOpacity 
                                        style={styles.dropdownButton}
                                        onPress={() => setOpenMenuOrderId(openMenuOrderId === order.id ? null : order.id)}
                                        disabled={isPending}
                                    >
                                        <Text style={styles.dropdownButtonText}>
                                            {getAllowedTransitions(order.status as OrderStatus).length > 0 ? "Update Status" : "No Actions"}
                                        </Text>
                                        <Ionicons name={openMenuOrderId === order.id ? "chevron-up" : "chevron-down"} size={16} color={Colors.white} />
                                    </TouchableOpacity>

                                    {/* Dropdown Menu */}
                                    {openMenuOrderId === order.id && (
                                        <View style={styles.dropdownMenuWrapper}>
                                            {getAllowedTransitions(order.status as OrderStatus).map((transition) => (
                                                <TouchableOpacity
                                                    key={transition}
                                                    style={styles.dropdownMenuItem}
                                                    onPress={() => {
                                                        updateStatus({ id: order.id, status: transition as OrderStatus });
                                                        setOpenMenuOrderId(null);
                                                    }}
                                                    disabled={isPending}
                                                >
                                                    <Text style={styles.dropdownMenuItemText}>
                                                        {transition.replace(/_/g, ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    emptyText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.md,
        color: Colors.muted,
    },
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
        backgroundColor: Colors.surface,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    orderId: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
        marginBottom: 4,
    },
    customerName: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    statusBadge: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xs,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 12,
    },
    itemsSection: {
        marginBottom: 12,
    },
    sectionLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    orderItems: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.text,
        lineHeight: 18,
    },
    detailsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        gap: 8,
    },
    detailItem: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
    },
    detailLabel: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    detailValue: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    totalSection: {
        backgroundColor: Colors.primary + "10",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    totalAmount: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.lg,
        color: Colors.primary,
    },
    infoRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
        flexWrap: "wrap",
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    infoText: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    paymentMode: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
    },
    paymentModeLabel: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    paymentModeValue: {
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    dropdownContainer: {
        flex: 1,
        position: "relative",
        zIndex: 1000,
    },
    dropdownButton: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
    },
    dropdownButtonText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.white,
    },
    dropdownMenuWrapper: {
        position: "absolute",
        bottom: 52,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: "hidden",
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    dropdownMenuItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    dropdownMenuItemText: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.text,
        textTransform: "capitalize",
    },
});
