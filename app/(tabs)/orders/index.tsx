import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { useRestaurantOrders, useUpdateOrderStatus, getAllowedTransitions } from "@/hooks/useOrders";
import { useSocketRestaurantOrders, useManageRestaurantOrder, useEmitOrderStatus } from "@/hooks/useSocketOrders";
import { useSocketStore } from "@/store/useSocketStore";
import { Ionicons } from "@expo/vector-icons";
import { OrderProgressBar } from "@/components/OrderProgressBar";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Image, Pressable, Modal } from "react-native";
import { OrderStatus } from "@/types/order";

const STATUS_TABS = ["PLACED", "ACCEPTED", "PREPARING", "READY", "CANCELLED"];
const TAB_LABELS = { PLACED: "Placed", ACCEPTED: "Accepted", PREPARING: "Preparing", READY: "Ready", CANCELLED: "Cancelled" };

const formatTransitionLabel = (transition: string): string => {
  return transition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getStatusColor = (status: string, Colors: any): string => {
    switch (status) {
        case "PLACED":
            return Colors.primary;
        case "ACCEPTED":
            return Colors.warning;
        case "PREPARING":
            return Colors.warning;
        case "READY":
            return Colors.success;
        case "PICKED_UP":
            return Colors.success;
        case "DELIVERED":
            return Colors.success;
        case "CANCELLED":
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
    const [page, setPage] = React.useState(1);
    const { data: response, isLoading, refetch } = useRestaurantOrders(page, 10);
    const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
    const { updateStatus: emitStatusUpdate } = useEmitOrderStatus();
    
    // ✅ Listen for real-time socket updates
    useSocketRestaurantOrders();
    const managingOrderId = useSocketStore((state) => state.managingOrderId);
    const setManagingOrder = useSocketStore((state) => state.setManagingOrder);

    // ✅ Join order tracking room when managing order
    useManageRestaurantOrder(managingOrderId);
    
    // ✅ Properly extract orders from API response { data, meta }
    const ordersArray = React.useMemo(() => {
        if (!response?.data || !Array.isArray(response.data)) return [];
        return response.data;
    }, [response]);

    // ✅ Extract pagination metadata from API response
    const pagination = React.useMemo(() => {
        if (!response?.meta) return { total: 0, page: 1, limit: 10, totalPages: 0 };
        return response.meta;
    }, [response]);
    const [activeTab, setActiveTab] = React.useState("PLACED");
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
    const selectedOrder = ordersArray.find(o => o.id === selectedOrderId);

        // Subscribe to socket pending orders so UI can refresh when new orders arrive
        const pendingOrders = useSocketStore(state => state.pendingOrders);
        const latestPendingIdRef = React.useRef<string | null>(null);

        // When a new pending order arrives and we're viewing PLACED tab, refetch the list
        React.useEffect(() => {
            if (activeTab !== 'PLACED') return;
            if (!pendingOrders || pendingOrders.length === 0) return;

            const latest = pendingOrders[0]?.orderId || null;
            if (!latest) return;

            // If the latest pending order is different from previous, trigger refetch
            if (latest !== latestPendingIdRef.current) {
                latestPendingIdRef.current = latest;
                console.log('[Orders] Detected new pending order from socket, refetching orders');
                if (refetch) refetch();
            }
        }, [pendingOrders, activeTab, refetch]);

    // ✅ SYNC: When selectedOrderId changes, update socket store so socket room gets joined
    React.useEffect(() => {
      if (selectedOrderId) {
        console.log(`[Orders] 📌 Opening order details for: ${selectedOrderId}`);
        setManagingOrder(selectedOrderId);
      } else {
        console.log(`[Orders] 📌 Closed order details`);
        setManagingOrder(null);
      }
    }, [selectedOrderId, setManagingOrder]);

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

    const filtered = (ordersArray || []).filter(o => o.status === activeTab);

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
            
            {/* Tabs - Sticky Header */}
            <View style={[styles.tabsWrapper, { zIndex: 1000 }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsScroll}
                    contentContainerStyle={styles.tabsContent}
                >
                    {STATUS_TABS.map(tab => (
                        <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            { 
                                backgroundColor: activeTab === tab ? Colors.primary : Colors.surface,
                                borderColor: activeTab === tab ? Colors.primary : Colors.border
                            }
                        ]}
                        onPress={() => {
                            setActiveTab(tab);
                        }}
                    >
                        <Text 
                            style={[
                                styles.tabText,
                                { color: activeTab === tab ? Colors.white : Colors.textSecondary }
                            ]}
                        >
                            {TAB_LABELS[tab as keyof typeof TAB_LABELS]}
                        </Text>
                    </TouchableOpacity>
                ))}
                </ScrollView>
            </View>



            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={48} color={Colors.muted} />
                    <Text style={[styles.emptyText, { color: Colors.muted }]}>No orders in this status</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.content, { marginBottom: 24, marginTop: 12 }]}
                    style={styles.contentScroll}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                            progressBackgroundColor={Colors.surface}
                            progressViewOffset={0}
                        />
                    }
                >
                    {filtered.map((order) => {
                        const itemImages = order.items?.slice(0, 2).map((item: any) => item.menuItem?.image).filter(Boolean) || [];

                        const allowedTransitions = getAllowedTransitions(order.status as OrderStatus);
                        
                        return (
                            <Pressable 
                                key={order.id}
                                onPress={() => setSelectedOrderId(order.id)}
                                style={({ pressed }) => [
                                    styles.premiumOrderCard,
                                    { opacity: pressed ? 0.85 : 1 }
                                ]}
                            >
                                {/* Top Header with Order ID and Status */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.headerLeft}>
                                        <View style={[
                                            styles.orderBadge,
                                            { borderLeftColor: getStatusColor(order.status, Colors) }
                                        ]}>
                                            <Text style={styles.orderBadgeText}>#{order.id.slice(-6).toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.headerInfo}>
                                            <Text style={styles.customerNameCard} numberOfLines={1}>
                                                {order.customer?.name || "Customer"}
                                            </Text>
                                            <Text style={styles.orderTimeCard}>
                                                {formatTimeAgo(order.placedAt)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.statusPill,
                                        { backgroundColor: getStatusColor(order.status, Colors) + "15" }
                                    ]}>
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: getStatusColor(order.status, Colors) }
                                        ]} />
                                        <Text style={[
                                            styles.statusPillText,
                                            { color: getStatusColor(order.status, Colors) }
                                        ]}>
                                            {getStatusLabel(order.status)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Items Summary */}
                                <View style={styles.cardSection}>
                                    <View style={styles.itemsSummary}>
                                        {itemImages.length > 0 && (
                                            <View style={styles.itemsThumbnails}>
                                                {itemImages.slice(0, 2).map((image: any, idx: number) => (
                                                    <Image
                                                        key={idx}
                                                        source={{ uri: image }}
                                                        style={[
                                                            styles.itemThumbnail,
                                                            { marginLeft: idx > 0 ? -8 : 0 }
                                                        ]}
                                                    />
                                                ))}
                                                {order.items?.length > 2 && (
                                                    <View style={styles.moreItemsBadge}>
                                                        <Text style={styles.moreItemsText}>
                                                            +{order.items.length - 2}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                        <View style={styles.itemsText}>
                                            <Text style={styles.itemsCountCard}>
                                                {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                                            </Text>
                                            <Text style={styles.itemsPreviewText} numberOfLines={1}>
                                                {formatItemsList(order.items).substring(0, 50)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Statistics Row */}
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="cash" size={14} color="#666" />
                                        <Text style={styles.statValue}>₹{order.totalAmount?.toFixed(0)}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Ionicons name="wallet" size={14} color={order.isPaid ? "#4CAF50" : "#FF6B35"} />
                                        <Text style={[styles.statValue, { color: order.isPaid ? "#4CAF50" : "#FF6B35" }]}>
                                            {order.isPaid ? "Paid" : "Unpaid"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Quick Action Buttons - Only show if has transitions */}
                                {allowedTransitions.length > 0 && (
                                    <View style={styles.quickActionsBar}>
                                        {allowedTransitions.slice(0, 2).map((transition, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => {
                                                    updateStatus({ id: order.id, status: transition as OrderStatus });
                                                    emitStatusUpdate(order.id, transition as OrderStatus);
                                                    console.log(`[Restaurant] Status updated: ${transition}`);
                                                }}
                                                style={[
                                                    styles.quickActionBtn,
                                                    { 
                                                        backgroundColor: idx === 0 ? getStatusColor(transition as any, Colors) : '#F5F5F5',
                                                        flex: 1
                                                    }
                                                ]}
                                                disabled={isPending}
                                            >
                                                <Ionicons 
                                                    name={idx === 0 ? "arrow-forward" : "close"} 
                                                    size={14} 
                                                    color={idx === 0 ? '#FFF' : '#666'} 
                                                />
                                                <Text style={[
                                                    styles.quickActionText,
                                                    { color: idx === 0 ? '#FFF' : '#666' }
                                                ]}>
                                                    {formatTransitionLabel(transition).split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* Tap to View Full Details */}
                                <Text style={styles.tapHint}>Tap to view details</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            )}

            {/* Pagination Bubbles with Arrows - Always Visible */}
            {pagination.totalPages > 1 && (
                <View style={styles.paginationBubbles}>
                    {/* Previous Arrow */}
                    <TouchableOpacity
                        onPress={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1 || isLoading}
                        style={[styles.arrowButton, { opacity: page === 1 ? 0.3 : 1 }]}
                    >
                        <Ionicons 
                            name="chevron-back" 
                            size={18} 
                            color={page === 1 ? Colors.muted : Colors.primary} 
                        />
                    </TouchableOpacity>

                    {/* Page Bubbles */}
                    {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isActive = pageNum === page;
                        return (
                            <TouchableOpacity
                                key={pageNum}
                                onPress={() => setPage(pageNum)}
                                disabled={isLoading}
                                style={[
                                    styles.bubbleButton,
                                    {
                                        backgroundColor: isActive ? Colors.primary : Colors.surface,
                                        borderColor: isActive ? Colors.primary : Colors.border,
                                        opacity: isLoading ? 0.6 : 1,
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.bubbleText,
                                    { color: isActive ? Colors.white : Colors.text }
                                ]}>
                                    {pageNum}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Next Arrow */}
                    <TouchableOpacity
                        onPress={() => setPage(Math.min(pagination.totalPages, page + 1))}
                        disabled={page >= pagination.totalPages || isLoading}
                        style={[styles.arrowButton, { opacity: page >= pagination.totalPages ? 0.3 : 1 }]}
                    >
                        <Ionicons 
                            name="chevron-forward" 
                            size={18} 
                            color={page >= pagination.totalPages ? Colors.muted : Colors.primary} 
                        />
                    </TouchableOpacity>
                </View>
            )}

            {/* Order Details Modal - Premium Design */}
            <Modal
                visible={selectedOrderId !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedOrderId(null)}
            >
                <View style={styles.modalBackground}>
                    <View style={[styles.premiumModalContainer, { backgroundColor: Colors.background }]}>
                        {/* Sticky Header */}
                        <View style={[styles.premiumModalHeader, { backgroundColor: getStatusColor(selectedOrder?.status || 'PLACED', Colors) }]}>
                            <TouchableOpacity onPress={() => setSelectedOrderId(null)}>
                                <Ionicons name="chevron-back" size={28} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.headerTitleSection}>
                                <Text style={styles.premiumModalTitle}>
                                    Order #{selectedOrder?.id.slice(-6).toUpperCase()}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {selectedOrder?.customer?.name || "Customer Order"}
                                </Text>
                            </View>
                            <View style={{ width: 28 }} />
                        </View>

                        {selectedOrder && (
                            <ScrollView
                                style={styles.premiumModalContent}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 24 }}
                            >
                                {/* ✅ ORDER PROGRESS BAR - Enhanced */}
                                <View style={[styles.progressContainer, { backgroundColor: Colors.surface }]}>
                                    <OrderProgressBar
                                        status={selectedOrder.status as any}
                                        size="large"
                                    />
                                </View>

                                {/* Status Actions - Currently Highlighted */}
                                {getAllowedTransitions(selectedOrder.status as OrderStatus).length > 0 && (
                                    <View style={styles.statusActionContainer}>
                                        <Text style={styles.actionLabel}>Next Action</Text>
                                        <View style={styles.actionButtonsGrid}>
                                            {getAllowedTransitions(selectedOrder.status as OrderStatus).map((transition, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    onPress={() => {
                                                        updateStatus({ id: selectedOrder.id, status: transition as OrderStatus });
                                                        emitStatusUpdate(selectedOrder.id, transition as OrderStatus);
                                                        console.log(`[Restaurant] Status updated to: ${transition}`);
                                                        setSelectedOrderId(null);
                                                    }}
                                                    disabled={isPending}
                                                    style={[
                                                        styles.largePrimaryBtn,
                                                        { 
                                                            flex: 1,
                                                            opacity: isPending ? 0.6 : 1
                                                        }
                                                    ]}
                                                >
                                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                                    <Text style={styles.largeBtnText}>
                                                        {formatTransitionLabel(transition)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Customer Section - Premium Card */}
                                <View style={[styles.premiumSection]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="person-circle" size={20} color="#FF6B35" />
                                        <Text style={styles.premiumSectionHeader}>Customer Details</Text>
                                    </View>
                                    <View style={styles.customerCard}>
                                        <View style={styles.customerRow}>
                                            <Text style={styles.customerLabel}>Name</Text>
                                            <Text style={styles.customerValue}>{selectedOrder.customer?.name || "N/A"}</Text>
                                        </View>
                                        <View style={[styles.customerRow, { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10, marginTop: 10 }]}>
                                            <Text style={styles.customerLabel}>Email</Text>
                                            <Text style={styles.customerValue}>{selectedOrder.customer?.email || "N/A"}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Items Section with Beautiful List */}
                                <View style={[styles.premiumSection]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="restaurant" size={20} color="#FF9800" />
                                        <Text style={styles.premiumSectionHeader}>Order Items</Text>
                                    </View>
                                    <View style={styles.itemsListContainer}>
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                            <View key={idx} style={[
                                                styles.premiumItemRow,
                                                { borderBottomWidth: idx < (selectedOrder.items?.length || 0) - 1 ? 1 : 0 }
                                            ]}>
                                                {item.menuItem?.image && (
                                                    <Image
                                                        source={{ uri: item.menuItem.image }}
                                                        style={styles.premiumItemImage}
                                                    />
                                                )}
                                                <View style={styles.premiumItemDetails}>
                                                    <Text style={styles.premiumItemName}>
                                                        {item.menuItem?.name || "Item"}
                                                    </Text>
                                                    <Text style={styles.premiumItemSpecs}>
                                                        ₹{item.menuItem?.price || 0} × {item.quantity}
                                                    </Text>
                                                </View>
                                                <Text style={styles.premiumItemTotal}>
                                                    ₹{((item.menuItem?.price || 0) * item.quantity).toFixed(0)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Order Summary - Premium */}
                                <View style={[styles.premiumSection]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="calculator" size={20} color="#4CAF50" />
                                        <Text style={styles.premiumSectionHeader}>Price Breakdown</Text>
                                    </View>
                                    <View style={styles.summaryContainer}>
                                        <View style={styles.premiumSummaryRow}>
                                            <Text style={styles.sumLabel}>Item Total</Text>
                                            <Text style={styles.sumValue}>₹{selectedOrder.itemTotal.toFixed(0)}</Text>
                                        </View>
                                        {selectedOrder.tax && selectedOrder.tax > 0 && (
                                            <View style={styles.premiumSummaryRow}>
                                                <Text style={styles.sumLabel}>Tax</Text>
                                                <Text style={styles.sumValue}>₹{selectedOrder.tax.toFixed(0)}</Text>
                                            </View>
                                        )}
                                        {selectedOrder.deliveryCharge && selectedOrder.deliveryCharge > 0 && (
                                            <View style={styles.premiumSummaryRow}>
                                                <Text style={styles.sumLabel}>Delivery Fee</Text>
                                                <Text style={styles.sumValue}>₹{selectedOrder.deliveryCharge.toFixed(0)}</Text>
                                            </View>
                                        )}
                                        {selectedOrder.discount && selectedOrder.discount > 0 && (
                                            <View style={styles.premiumSummaryRow}>
                                                <Text style={[styles.sumLabel, { color: '#4CAF50' }]}>Discount</Text>
                                                <Text style={[styles.sumValue, { color: '#4CAF50' }]}>-₹{selectedOrder.discount.toFixed(0)}</Text>
                                            </View>
                                        )}
                                        <View style={[styles.premiumSummaryRow, styles.totalRow]}>
                                            <Text style={styles.totalLabel}>Total Amount</Text>
                                            <Text style={styles.totalAmount}>₹{selectedOrder.totalAmount.toFixed(0)}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Order Meta Info */}
                                <View style={[styles.premiumSection]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="information-circle" size={20} color="#2196F3" />
                                        <Text style={styles.premiumSectionHeader}>Order Information</Text>
                                    </View>
                                    <View style={styles.metaContainer}>
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Placed At</Text>
                                            <Text style={styles.metaValue}>
                                                {new Date(selectedOrder.placedAt).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Text style={styles.metaLabel}>Payment Status</Text>
                                            <View style={[
                                                styles.paymentBadge,
                                                { backgroundColor: selectedOrder.isPaid ? '#E8F5E9' : '#FFEBEE' }
                                            ]}>
                                                <Ionicons 
                                                    name={selectedOrder.isPaid ? "checkmark-circle" : "alert-circle"} 
                                                    size={14} 
                                                    color={selectedOrder.isPaid ? '#4CAF50' : '#FF6B35'}
                                                />
                                                <Text style={[
                                                    styles.paymentText,
                                                    { color: selectedOrder.isPaid ? '#4CAF50' : '#FF6B35' }
                                                ]}>
                                                    {selectedOrder.isPaid ? "Paid" : "Unpaid"}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 4,
    },
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
    tabsWrapper: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingTop: 8,
        paddingBottom: 8,
    },
    tabsScroll: {
        height: 48,
        flexGrow: 0,
        maxHeight: 60,
    },
    tabsContent: {
        paddingHorizontal: 16,
        gap: 10,
        paddingVertical: 0,
    },
    tab: {
        height: 36,
        marginVertical: 4,
        paddingHorizontal: 18,
        borderRadius: 18,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 90,
    },
    tabText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xs,
    },
    
    /* Action Bar */
    actionBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 12,
        marginVertical: 14,
        marginTop: 8,
        borderRadius: 12,
        gap: 12,
        backgroundColor: Colors.primary,
    },
    selectionCount: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        flex: 1,
        color: Colors.white,
    },
    actionButtonsRow: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.white,
        borderRadius: 8,
    },
    actionButtonText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    cancelButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: Colors.danger,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.white,
    },

    /* Modal Background */
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "flex-end",
    },
    orderCard: { /* deprecated - kept for backwards compatibility */
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        backgroundColor: Colors.surface,
        borderColor: Colors.border,
    },

    /* ✨ PREMIUM ORDER CARD - Modern Design */
    premiumOrderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        marginHorizontal: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    orderBadge: {
        borderLeftWidth: 4,
        paddingLeft: 8,
        paddingRight: 2,
    },
    orderBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerInfo: {
        flex: 1,
    },
    customerNameCard: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    orderTimeCard: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardSection: {
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    itemsSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemsThumbnails: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 70,
    },
    itemThumbnail: {
        width: 45,
        height: 45,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FFF',
        backgroundColor: '#F5F5F5',
    },
    moreItemsBadge: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10,
    },
    moreItemsText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },
    itemsText: {
        flex: 1,
    },
    itemsCountCard: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    itemsPreviewText: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#E0E0E0',
    },
    quickActionsBar: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    quickActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: '600',
    },
    tapHint: {
        fontSize: 10,
        color: '#CCC',
        textAlign: 'center',
        paddingHorizontal: 14,
        paddingBottom: 10,
    },

    /* ✨ PREMIUM MODAL - Premium Order Details */
    premiumModalContainer: {
        height: '90%',
        backgroundColor: Colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    premiumModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 18,
    },
    headerTitleSection: {
        flex: 1,
        alignItems: 'center',
    },
    premiumModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    modalSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    premiumModalContent: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: Colors.background,
    },
    progressContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        marginVertical: 12,
        marginHorizontal: 0,
    },
    statusActionContainer: {
        paddingHorizontal: 0,
        paddingVertical: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    actionButtonsGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    largePrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FF6B35',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B35',
    },
    largeBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
    premiumSection: {
        marginVertical: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    premiumSectionHeader: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    customerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    customerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    customerValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    itemsListContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
    },
    premiumItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomColor: '#F0F0F0',
    },
    premiumItemImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
    },
    premiumItemDetails: {
        flex: 1,
    },
    premiumItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    premiumItemSpecs: {
        fontSize: 11,
        color: '#999',
    },
    premiumItemTotal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FF6B35',
    },
    summaryContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    premiumSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    sumLabel: {
        fontSize: 12,
        color: '#666',
    },
    sumValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    totalRow: {
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FF6B35',
    },
    metaContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
    },
    metaItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    metaItem_last: {
        borderBottomWidth: 0,
    },
    metaLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    paymentText: {
        fontSize: 12,
        fontWeight: '600',
    },

    /* Content Scroll */
    content: { 
        paddingHorizontal: 0,
        paddingBottom: 24, 
        gap: 0,
        paddingTop: 8,
    },
    contentScroll: { 
        flex: 1,
    },

    /* Pagination Bar */
    paginationBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    paginationButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.background,
    },
    paginationButtonText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.primary,
    },
    paginationInfo: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
        textAlign: "center",
        flex: 1,
    },

    /* Load More Button */
    loadMoreButtonSimple: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginVertical: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: Colors.background,
    },
    loadMoreTextSimple: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.primary,
    },

    /* Pagination Bubbles */
    paginationBubbles: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexWrap: "wrap",
    },
    arrowButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.surface,
    },
    bubbleButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    bubbleText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xs,
        color: Colors.text,
    },
});
