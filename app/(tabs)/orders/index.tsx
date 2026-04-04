import { Colors } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { useRestaurantOrders, useUpdateOrderStatus, getAllowedTransitions } from "@/hooks/useOrders";
import { Ionicons } from "@expo/vector-icons";
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

const getStatusActionLabel = (status: string): string => {
  const allowedTransitions = getAllowedTransitions(status as OrderStatus);
  if (allowedTransitions.length === 0) return "No Actions Available";
  const nextStatus = allowedTransitions[0];
  return `${formatTransitionLabel(nextStatus)}`;
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
    const [selectedOrderIds, setSelectedOrderIds] = React.useState<Set<string>>(new Set());
    const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
    const selectedOrder = ordersArray.find(o => o.id === selectedOrderId);

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

    const handleSelectOrder = (orderId: string) => {
        const newSelected = new Set(selectedOrderIds);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrderIds(newSelected);
    };

    const handleBulkStatusUpdate = () => {
        const allowedTransitions = getAllowedTransitions(activeTab as OrderStatus);
        if (allowedTransitions.length === 0) return;
        
        const nextStatus = allowedTransitions[0] as OrderStatus;
        selectedOrderIds.forEach(orderId => {
            updateStatus({ id: orderId, status: nextStatus });
        });
        setSelectedOrderIds(new Set());
    };

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
                            setSelectedOrderIds(new Set());
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

            {selectedOrderIds.size > 0 && getAllowedTransitions(activeTab as OrderStatus).length > 0 && (
                <View style={[styles.actionBar, { backgroundColor: Colors.primary }, { zIndex: 100 }]}>
                    <Text style={[styles.selectionCount, { color: Colors.white }]}>
                        {selectedOrderIds.size} selected
                    </Text>
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            onPress={handleBulkStatusUpdate}
                            disabled={isPending}
                            style={[styles.actionButton, { opacity: isPending ? 0.6 : 1 }]}
                        >
                            <Text style={styles.actionButtonText}>
                                {getStatusActionLabel(activeTab)}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        {getAllowedTransitions(activeTab as OrderStatus).includes("CANCELLED" as OrderStatus) && (
                            <TouchableOpacity
                                onPress={() => {
                                    selectedOrderIds.forEach(orderId => {
                                        updateStatus({ id: orderId, status: "CANCELLED" as OrderStatus });
                                    });
                                    setSelectedOrderIds(new Set());
                                }}
                                disabled={isPending}
                                style={[styles.cancelButton, { opacity: isPending ? 0.6 : 1 }]}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

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
                        const isSelected = selectedOrderIds.has(order.id);
                        const itemImages = order.items?.slice(0, 2).map((item: any) => item.menuItem?.image).filter(Boolean) || [];

                        return (
                            <Pressable 
                                key={order.id}
                                onPress={() => handleSelectOrder(order.id)}
                                style={({ pressed }) => [styles.orderCard, {
                                    backgroundColor: isSelected ? Colors.background : Colors.surface,
                                    borderColor: isSelected ? Colors.primary : Colors.border,
                                    borderWidth: isSelected ? 2 : 1,
                                    opacity: pressed ? 0.7 : 1,
                                }]}
                            >
                                {/* Selection Checkbox */}
                                <View style={styles.cardTop}>
                                    <View 
                                        style={[
                                            styles.checkbox,
                                            {
                                                backgroundColor: isSelected ? Colors.primary : Colors.background,
                                                borderColor: Colors.border,
                                            }
                                        ]}
                                    >
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={16} color={Colors.white} />
                                        )}
                                    </View>

                                    <View style={styles.orderHeaderContent}>
                                        <Text style={[styles.orderId, { color: Colors.text }]}>
                                            #{order.id.slice(-6).toUpperCase()}
                                        </Text>
                                        <Text style={[styles.customerName, { color: Colors.textSecondary }]}>
                                            {order.customer?.name || "Customer"}
                                        </Text>
                                    </View>

                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(order.status, Colors) + "22" }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: getStatusColor(order.status, Colors) }
                                        ]}>
                                            {getStatusLabel(order.status)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Items Preview with Images */}
                                <View style={styles.itemsPreview}>
                                    {itemImages.length > 0 && (
                                        <View style={styles.imageStack}>
                                            {itemImages.map((image: any, idx: number) => (
                                                <Image
                                                    key={idx}
                                                    source={{ uri: image }}
                                                    style={[
                                                        styles.itemImage,
                                                        { marginLeft: idx > 0 ? -12 : 0, zIndex: itemImages.length - idx }
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    )}
                                    <View style={styles.itemsInfo}>
                                        <Text style={[styles.itemsCount, { color: Colors.text }]}>
                                            {order.items?.length || 0} Item{order.items?.length !== 1 ? 's' : ''}
                                        </Text>
                                        <Text style={[styles.itemsLabel, { color: Colors.textSecondary }]} numberOfLines={1}>
                                            {formatItemsList(order.items).substring(0, 40)}...
                                        </Text>
                                    </View>
                                </View>

                                {/* View Details Button */}
                                <TouchableOpacity
                                    onPress={() => setSelectedOrderId(order.id)}
                                    style={[styles.viewButton]}
                                >
                                    <Text style={styles.viewButtonText}>View in detail</Text>
                                    <Ionicons name="arrow-forward" size={12} color={Colors.white} />
                                </TouchableOpacity>

                                {/* Details Grid */}
                                <View style={styles.detailsGrid}>
                                    <View style={[styles.detailItem, { backgroundColor: Colors.background }]}>
                                        <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Total</Text>
                                        <Text style={[styles.detailValue, { color: Colors.text }]}>
                                            ₹{order.totalAmount?.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={[styles.detailItem, { backgroundColor: Colors.background }]}>
                                        <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Time</Text>
                                        <Text style={[styles.detailValue, { color: Colors.text }]}>
                                            {formatTimeAgo(order.placedAt)}
                                        </Text>
                                    </View>
                                    <View style={[styles.detailItem, { backgroundColor: Colors.background }]}>
                                        <Text style={[styles.detailLabel, { color: Colors.textSecondary }]}>Payment</Text>
                                        <Text style={[
                                            styles.detailValue,
                                            { color: order.isPaid ? Colors.success : Colors.danger }
                                        ]}>
                                            {order.isPaid ? "Paid" : "Unpaid"}
                                        </Text>
                                    </View>
                                </View>
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

            {/* Order Details Modal */}
            <Modal
                visible={selectedOrderId !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedOrderId(null)}
            >
                <View style={styles.modalBackground}>
                    <View style={[styles.detailsModalContainer, { backgroundColor: Colors.background }]}>
                        <View style={[styles.detailsModalHeader, { backgroundColor: Colors.surface, borderBottomColor: Colors.border }]}>
                            <TouchableOpacity onPress={() => setSelectedOrderId(null)}>
                                <Ionicons name="chevron-back" size={28} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.detailsModalTitle, { color: Colors.text }]}>
                                Order #{selectedOrder?.id.slice(-6).toUpperCase()}
                            </Text>
                            <View style={{ width: 28 }} />
                        </View>

                        {selectedOrder && (
                            <ScrollView
                                style={styles.detailsModalContent}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 24 }}
                            >
                                <View style={[styles.detailsSection, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
                                    <Text style={[styles.sectionHeader, { color: Colors.text }]}>Customer Information</Text>
                                    <View style={styles.detailsRow}>
                                        <Text style={[styles.detailsLabel, { color: Colors.textSecondary }]}>Name</Text>
                                        <Text style={[styles.detailsValue, { color: Colors.text }]}>
                                            {selectedOrder.customer?.name || "N/A"}
                                        </Text>
                                    </View>
                                    <View style={styles.detailsRow}>
                                        <Text style={[styles.detailsLabel, { color: Colors.textSecondary }]}>Email</Text>
                                        <Text style={[styles.detailsValue, { color: Colors.text }]}>
                                            {selectedOrder.customer?.email || "N/A"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Order Items */}
                                <View style={[styles.detailsSection, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
                                    <Text style={[styles.sectionHeader, { color: Colors.text }]}>Items</Text>
                                    {selectedOrder.items?.map((item: any, idx: number) => (
                                        <View key={idx} style={[styles.itemRow, { borderBottomColor: Colors.border, borderBottomWidth: idx < (selectedOrder.items?.length || 0) - 1 ? 1 : 0 }]}>
                                            {item.menuItem?.image && (
                                                <Image
                                                    source={{ uri: item.menuItem.image }}
                                                    style={styles.itemDetailsImage}
                                                />
                                            )}
                                            <View style={styles.itemDetailsInfo}>
                                                <Text style={[styles.itemName, { color: Colors.text }]}>
                                                    {item.menuItem?.name || "Item"}
                                                </Text>
                                                <Text style={[styles.itemPrice, { color: Colors.textSecondary }]}>
                                                    ₹{item.menuItem?.price || 0} × {item.quantity}
                                                </Text>
                                            </View>
                                            <Text style={[styles.itemTotal, { color: Colors.text }]}>
                                                ₹{((item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Order Status & Payment */}
                                <View style={[styles.detailsSection, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
                                    <Text style={[styles.sectionHeader, { color: Colors.text }]}>Order Status</Text>
                                    <View style={styles.detailsRow}>
                                        <Text style={[styles.detailsLabel, { color: Colors.textSecondary }]}>Status</Text>
                                        <View style={[
                                            styles.statusBadgeModal,
                                            { backgroundColor: getStatusColor(selectedOrder.status, Colors) + "22" }
                                        ]}>
                                            <Text style={[
                                                styles.statusTextModal,
                                                { color: getStatusColor(selectedOrder.status, Colors) }
                                            ]}>
                                                {getStatusLabel(selectedOrder.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.detailsRow}>
                                        <Text style={[styles.detailsLabel, { color: Colors.textSecondary }]}>Placed At</Text>
                                        <Text style={[styles.detailsValue, { color: Colors.text }]}>
                                            {new Date(selectedOrder.placedAt).toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailsRow}>
                                        <Text style={[styles.detailsLabel, { color: Colors.textSecondary }]}>Payment Status</Text>
                                        <Text style={[styles.detailsValue, { color: selectedOrder.isPaid ? Colors.success : Colors.danger }]}>
                                            {selectedOrder.isPaid ? "Paid" : "Unpaid"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Order Summary */}
                                <View style={[styles.detailsSection, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
                                    <Text style={[styles.sectionHeader, { color: Colors.text }]}>Order Summary</Text>
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Item Total</Text>
                                        <Text style={[styles.summaryValue, { color: Colors.text }]}>
                                            ₹{selectedOrder.itemTotal.toFixed(2)}
                                        </Text>
                                    </View>
                                    {selectedOrder.tax && selectedOrder.tax > 0 && (
                                        <View style={styles.summaryRow}>
                                            <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Tax</Text>
                                            <Text style={[styles.summaryValue, { color: Colors.text }]}>
                                                ₹{selectedOrder.tax.toFixed(2)}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedOrder.deliveryCharge && selectedOrder.deliveryCharge > 0 && (
                                        <View style={styles.summaryRow}>
                                            <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Delivery Charge</Text>
                                            <Text style={[styles.summaryValue, { color: Colors.text }]}>
                                                ₹{selectedOrder.deliveryCharge.toFixed(2)}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedOrder.platformFee && selectedOrder.platformFee > 0 && (
                                        <View style={styles.summaryRow}>
                                            <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Platform Fee</Text>
                                            <Text style={[styles.summaryValue, { color: Colors.text }]}>
                                                ₹{selectedOrder.platformFee.toFixed(2)}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedOrder.discount && selectedOrder.discount > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, { color: Colors.success }]}>Discount</Text>
                                        <Text style={[styles.summaryValue, { color: Colors.success }]}>
                                            -₹{selectedOrder.discount.toFixed(2)}
                                        </Text>
                                    </View>
                                )}
                                <View style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: Colors.border }]}>
                                    <Text style={[styles.totalLabel, { color: Colors.text }]}>Total</Text>
                                    <Text style={[styles.totalValue, { color: Colors.primary }]}>
                                        ₹{selectedOrder.totalAmount.toFixed(2)}
                                    </Text>
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
        height: 40,
        marginVertical: 4,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 100,
    },
    tabText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
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

    /* Order Card */
    content: { 
        paddingHorizontal: 16, 
        paddingBottom: 24, 
        gap: 12, 
        paddingTop: 8,
    },
    contentScroll: { 
        flex: 1,
    },
    orderCard: {
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        backgroundColor: Colors.surface,
        borderColor: Colors.border,
    },

    /* Card Top - Header with Checkbox */
    cardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
        borderColor: Colors.border,
    },
    orderHeaderContent: {
        flex: 1,
    },
    orderId: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        marginBottom: 2,
        color: Colors.text,
    },
    customerName: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    statusBadge: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xs,
    },

    /* Items Preview */
    itemsPreview: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    imageStack: {
        flexDirection: "row",
        alignItems: "center",
        width: 80,
        height: 60,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: Colors.white,
    },
    itemsInfo: {
        flex: 1,
    },
    itemsCount: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        marginBottom: 2,
        color: Colors.text,
    },
    itemsLabel: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },

    /* Details Grid */
    detailsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    detailItem: {
        flex: 1,
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    detailLabel: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        marginBottom: 4,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
    },

    /* View Details Button */
    viewButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginVertical: 8,
        alignSelf: "flex-start",
       
    },
    viewButtonText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xs,
        color: 'black',
    },

    /* Details Modal */
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    detailsModalContainer: {
        height: "75%",
        backgroundColor: Colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    detailsModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailsModalTitle: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.lg,
        color: Colors.text,
    },
    detailsModalContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: Colors.background,
    },
    detailsSection: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionHeader: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + "40",
    },
    detailsLabel: {
        fontFamily: Fonts.brandMedium,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    detailsValue: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
    },
    itemDetailsImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        resizeMode: "cover",
    },
    itemDetailsInfo: {
        flex: 1,
    },
    itemName: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
        marginBottom: 4,
    },
    itemPrice: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    itemTotal: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    statusBadgeModal: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    statusTextModal: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.xs,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
    },
    summaryLabel: {
        fontFamily: Fonts.brand,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    summaryTotal: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    totalLabel: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.md,
        color: Colors.text,
    },
    totalValue: {
        fontFamily: Fonts.brandBlack,
        fontSize: FontSize.md,
        color: Colors.primary,
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

