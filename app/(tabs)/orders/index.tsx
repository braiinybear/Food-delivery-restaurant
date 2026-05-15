import { ThemeType } from "@/constants/colors";
import { FontSize, Fonts } from "@/constants/typography";
import { useRestaurantOrders, useUpdateOrderStatus, useBulkUpdateOrderStatus, getAllowedTransitions } from "@/hooks/useOrders";
import { useSocketRestaurantOrders, useManageRestaurantOrder, useEmitOrderStatus } from "@/hooks/useSocketOrders";
import { useSocketStore } from "@/store/useSocketStore";
import { Ionicons } from "@expo/vector-icons";
import { OrderProgressBar } from "@/components/OrderProgressBar";
import React, { useMemo } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Image, Pressable, Modal, Animated, Easing } from "react-native";
import { OrderStatus } from "@/types/order";
import { useTheme } from "@/context/ThemeContext";

const STATUS_TABS = ["PLACED", "ACCEPTED", "PREPARING", "READY", "CANCELLED"];
const TAB_LABELS = { PLACED: "Placed", ACCEPTED: "Accepted", PREPARING: "Preparing", READY: "Ready", CANCELLED: "Cancelled" };

const formatTransitionLabel = (transition: string): string => {
  return transition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getStatusColor = (status: string, Colors: ThemeType): string => {
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
    const { Colors, isDark } = useTheme();
    const styles = useMemo(() => createStyles(Colors, isDark), [Colors, isDark]);
    const [activeTab, setActiveTab] = React.useState("PLACED");
    const [page, setPage] = React.useState(1);
    const { data: response, isLoading, refetch } = useRestaurantOrders(page, 10, activeTab);
    const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
    const { mutate: bulkUpdateStatus, isPending: isBulkPending } = useBulkUpdateOrderStatus();
    
    useSocketRestaurantOrders();
    const managingOrderId = useSocketStore((state) => state.managingOrderId);
    const setManagingOrder = useSocketStore((state) => state.setManagingOrder);

    useManageRestaurantOrder(managingOrderId);
    
    const ordersArray = React.useMemo(() => {
        if (!response?.data || !Array.isArray(response.data)) return [];
        return response.data;
    }, [response]);

    const pagination = React.useMemo(() => {
        if (!response?.meta) return { total: 0, page: 1, limit: 10, totalPages: 0 };
        return response.meta;
    }, [response]);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);
    const isSelectionMode = selectedOrderIds.length > 0;
    const selectedOrder = ordersArray.find(o => o.id === selectedOrderId);

        const pendingOrders = useSocketStore(state => state.pendingOrders);
        const latestPendingIdRef = React.useRef<string | null>(null);

        React.useEffect(() => {
            if (activeTab !== 'PLACED') return;
            if (!pendingOrders || pendingOrders.length === 0) return;

            const latest = pendingOrders[0]?.orderId || null;
            if (!latest) return;

            if (latest !== latestPendingIdRef.current) {
                latestPendingIdRef.current = latest;
                console.log('[Orders] Detected new pending order from socket, refetching orders');
                if (refetch) refetch();
            }
        }, [pendingOrders, activeTab, refetch]);

    React.useEffect(() => {
      if (selectedOrderId) {
        setManagingOrder(selectedOrderId);
      } else {
        setManagingOrder(null);
      }
    }, [selectedOrderId, setManagingOrder]);

    React.useEffect(() => {
      if (managingOrderId && managingOrderId !== selectedOrderId) {
        setSelectedOrderId(managingOrderId);
      }
    }, [managingOrderId]);

    React.useEffect(() => {
        setPage(1);
        setSelectedOrderIds([]); 
    }, [activeTab]);

    const spinAnim = React.useRef(new Animated.Value(0)).current;

    const handleRefresh = React.useCallback(async () => {
        setIsRefreshing(true);
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        try {
            if (refetch) {
                await refetch();
            }
        } catch (error) {
            console.error("Error refreshing orders:", error);
        } finally {
            setIsRefreshing(false);
            setTimeout(() => {
                spinAnim.stopAnimation();
                spinAnim.setValue(0);
            }, 600);
        }
    }, [refetch, spinAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const isSocketConnected = useSocketStore((state) => state.isConnected);
    const filtered = ordersArray; 

    const toggleSelection = React.useCallback((orderId: string) => {
        setSelectedOrderIds(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId) 
                : [...prev, orderId]
        );
    }, []);

    const handleBulkStatusUpdate = React.useCallback(async (status: OrderStatus) => {
        if (selectedOrderIds.length === 0) return;
        
        bulkUpdateStatus({
            orderIds: selectedOrderIds,
            status
        }, {
            onSuccess: () => {
                setSelectedOrderIds([]);
            }
        });
    }, [selectedOrderIds, bulkUpdateStatus]);

    const selectAll = React.useCallback(() => {
        setSelectedOrderIds(filtered.map(o => o.id));
    }, [filtered]);

    const clearSelection = React.useCallback(() => {
        setSelectedOrderIds([]);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? Colors.background : Colors.secondary} />
            
            <View style={styles.topHeader}>
                <View style={{ flex: 1 }}>
                    {isSelectionMode ? (
                        <View style={styles.selectionHeader}>
                            <TouchableOpacity onPress={clearSelection} style={styles.closeIconBtn}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.selectionCountText}>
                                {selectedOrderIds.length} Selected
                            </Text>
                            <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
                                <Text style={styles.selectAllText}>Select All</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.headerTitleRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.instructionText}>Manage and track your live restaurant orders in real-time.</Text>
                            </View>
                            <View style={styles.statusGroup}>
                                <View style={styles.liveStatusContainer}>
                                    <View style={[
                                        styles.statusDotHeader, 
                                        { backgroundColor: isSocketConnected ? '#4CAF50' : '#F44336' }
                                    ]} />
                                    <Text style={styles.statusTextHeader}>
                                        {isSocketConnected ? 'LIVE' : 'OFFLINE'}
                                    </Text>
                                </View>

                                {!isSelectionMode && (
                                    <TouchableOpacity 
                                        onPress={handleRefresh}
                                        disabled={isRefreshing}
                                        style={styles.miniRefreshBtn}
                                    >
                                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                            <Ionicons name="refresh" size={16} color={Colors.primary} />
                                        </Animated.View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </View>

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
                                backgroundColor: activeTab === tab ? Colors.primary : (isDark ? 'transparent' : Colors.surface),
                                borderColor: activeTab === tab ? Colors.primary : (isDark ? 'transparent' : Colors.border)
                            }
                        ]}
                        onPress={() => setActiveTab(tab)}
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
                    contentContainerStyle={styles.content}
                    style={styles.contentScroll}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                            progressBackgroundColor={Colors.surface}
                        />
                    }
                >
                    {filtered.map((order) => {
                        const itemImages = order.items?.slice(0, 2).map((item: any) => item.menuItem?.image).filter(Boolean) || [];
                        const allowedTransitions = getAllowedTransitions(order.status as OrderStatus);
                        
                        return (
                            <Pressable 
                                key={order.id}
                                onPress={() => {
                                    if (isSelectionMode) toggleSelection(order.id);
                                    else setSelectedOrderId(order.id);
                                }}
                                onLongPress={() => {
                                    if (!isSelectionMode) toggleSelection(order.id);
                                }}
                                style={[
                                    styles.premiumOrderCard,
                                    selectedOrderIds.includes(order.id) && styles.orderCardSelected
                                ]}
                            >
                                {selectedOrderIds.includes(order.id) && (
                                    <View style={styles.selectionIndicator}>
                                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                                    </View>
                                )}
                                <View style={styles.cardHeader}>
                                    <View style={styles.headerLeft}>
                                        <View style={[styles.orderBadge, { borderLeftColor: getStatusColor(order.status, Colors) }]}>
                                            <Text style={styles.orderBadgeText}>#{order.id.slice(-6).toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.headerInfo}>
                                            <Text style={styles.customerNameCard} numberOfLines={1}>
                                                {(order as any).customerAddress?.receiverName || order.customer?.name || "Customer"}
                                            </Text>
                                            <Text style={styles.orderTimeCard}>{formatTimeAgo(order.placedAt)}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusPill, { backgroundColor: getStatusColor(order.status, Colors) + "15" }]}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status, Colors) }]} />
                                        <Text style={[styles.statusPillText, { color: getStatusColor(order.status, Colors) }]}>
                                            {getStatusLabel(order.status)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardSection}>
                                    <View style={styles.itemsSummary}>
                                        {itemImages.length > 0 && (
                                            <View style={styles.itemsThumbnails}>
                                                {itemImages.slice(0, 2).map((image: any, idx: number) => (
                                                    <Image key={idx} source={{ uri: image }} style={[styles.itemThumbnail, { marginLeft: idx > 0 ? -8 : 0 }]} />
                                                ))}
                                                {order.items?.length > 2 && (
                                                    <View style={styles.moreItemsBadge}>
                                                        <Text style={styles.moreItemsText}>+{order.items.length - 2}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                        <View style={styles.itemsText}>
                                            <Text style={styles.itemsCountCard}>{order.items?.length || 0} items</Text>
                                            <Text style={styles.itemsPreviewText} numberOfLines={1}>{formatItemsList(order.items)}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="cash-outline" size={14} color={Colors.textSecondary} />
                                        <Text style={styles.statValue}>₹{order.totalAmount?.toFixed(0)}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Ionicons name="wallet-outline" size={14} color={order.isPaid ? Colors.success : Colors.secondary} />
                                        <Text style={[styles.statValue, { color: order.isPaid ? Colors.success : Colors.secondary }]}>
                                            {order.isPaid ? "Paid" : "Unpaid"}
                                        </Text>
                                    </View>
                                </View>

                                {allowedTransitions.length > 0 && (
                                    <View style={styles.quickActionsBar}>
                                        {allowedTransitions.slice(0, 2).map((transition, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => updateStatus({ id: order.id, status: transition as OrderStatus })}
                                                style={[
                                                    styles.quickActionBtn,
                                                    { 
                                                        backgroundColor: idx === 0 ? getStatusColor(transition as any, Colors) : Colors.surface,
                                                        flex: 1
                                                    }
                                                ]}
                                                disabled={isPending}
                                            >
                                                <Ionicons name={idx === 0 ? "arrow-forward" : "close"} size={14} color={idx === 0 ? Colors.white : Colors.textSecondary} />
                                                <Text style={[styles.quickActionText, { color: idx === 0 ? Colors.white : Colors.textSecondary }]}>
                                                    {formatTransitionLabel(transition).split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            )}

            {isSelectionMode && (
                <View style={styles.bulkActionFloatingContainer}>
                    <View style={styles.bulkActionBarPremium}>
                        <View style={styles.bulkInfo}>
                            <Text style={styles.bulkCountText}>{selectedOrderIds.length}</Text>
                            <Text style={styles.bulkLabelText}>Selected</Text>
                        </View>
                        <View style={styles.bulkActionsRow}>
                            {activeTab === 'PLACED' && (
                                <TouchableOpacity style={styles.premiumBulkBtn} onPress={() => handleBulkStatusUpdate('ACCEPTED')} disabled={isBulkPending}>
                                    {isBulkPending ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.premiumBulkBtnText}>Accept</Text>}
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.bulkCloseBtn} onPress={clearSelection}>
                                <Ionicons name="close" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <Modal visible={selectedOrderId !== null} transparent animationType="slide" onRequestClose={() => setSelectedOrderId(null)}>
                <View style={styles.modalBackground}>
                    <View style={styles.premiumModalContainer}>
                        <View style={[styles.premiumModalHeader, { backgroundColor: getStatusColor(selectedOrder?.status || 'PLACED', Colors) }]}>
                            <TouchableOpacity onPress={() => setSelectedOrderId(null)}><Ionicons name="chevron-back" size={28} color="#FFF" /></TouchableOpacity>
                            <View style={styles.headerTitleSection}>
                                <Text style={styles.premiumModalTitle}>Order #{selectedOrder?.id.slice(-6).toUpperCase()}</Text>
                                <Text style={styles.modalSubtitle}>{selectedOrder?.customer?.name || "Customer Order"}</Text>
                            </View>
                            <View style={{ width: 28 }} />
                        </View>

                        {selectedOrder && (
                            <ScrollView style={styles.premiumModalContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                                <View style={styles.progressContainer}>
                                    <OrderProgressBar status={selectedOrder.status as any} size="large" />
                                </View>

                                {getAllowedTransitions(selectedOrder.status as OrderStatus).length > 0 && (
                                    <View style={styles.statusActionContainer}>
                                        <Text style={styles.actionLabel}>Next Action</Text>
                                        <View style={styles.actionButtonsGrid}>
                                            {getAllowedTransitions(selectedOrder.status as OrderStatus).map((transition, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    onPress={() => { updateStatus({ id: selectedOrder.id, status: transition as OrderStatus }); setSelectedOrderId(null); }}
                                                    disabled={isPending}
                                                    style={[styles.largePrimaryBtn, { backgroundColor: getStatusColor(transition as any, Colors) }]}
                                                >
                                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                                    <Text style={styles.largeBtnText}>{formatTransitionLabel(transition)}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <View style={styles.premiumSection}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="person-circle" size={20} color={Colors.primary} />
                                        <Text style={styles.premiumSectionHeader}>Customer Details</Text>
                                    </View>
                                    <View style={styles.customerCard}>
                                        <View style={styles.customerRow}>
                                            <Text style={styles.customerLabel}>Name</Text>
                                            <Text style={styles.customerValue}>{(selectedOrder as any).customerAddress?.receiverName || selectedOrder.customer?.name || "N/A"}</Text>
                                        </View>
                                        <View style={styles.customerRowSeparator}>
                                            <Text style={styles.customerLabel}>Phone</Text>
                                            <Text style={styles.customerValue}>{(selectedOrder as any).customerAddress?.receiverPhone || (selectedOrder.customer as any)?.phoneNumber || "N/A"}</Text>
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

const createStyles = (Colors: ThemeType, isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    statusRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    statusDotHeader: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusTextHeader: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontFamily: Fonts.brandMedium,
    },
    refreshIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectionCountText: {
        fontSize: 18,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    bulkActionBar: {
        position: 'absolute',
        bottom: 90, 
        left: 20,
        right: 20,
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 10,
        zIndex: 9999, 
    },
    bulkActionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    bulkActionButton: {
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    bulkActionButtonText: {
        color: Colors.primary,
        fontFamily: Fonts.brandBold,
        fontSize: 14,
    },
    bulkActionCancel: {
        padding: 8,
    },
    orderCardSelected: {
        borderColor: Colors.primary,
        borderWidth: 2,
        backgroundColor: Colors.primary + "08",
    },
    selectionIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
        backgroundColor: isDark ? Colors.background : Colors.surface,
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
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        fontFamily: Fonts.brandBold,
        fontSize: FontSize.sm,
        color: Colors.white,
    },

    /* Header Redesign */
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitleText: {
        fontSize: 24,
        fontFamily: Fonts.brandBlack,
        color: Colors.text,
    },
    instructionText: {
        fontSize: 13,
        fontFamily: Fonts.brandMedium,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    liveStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: isDark ? Colors.background : Colors.success + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isDark ? Colors.border : Colors.success + '30',
    },
    statusGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniRefreshBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIconBtn: {
        padding: 4,
    },
    selectAllBtn: {
        marginLeft: 'auto',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Colors.primary + '15',
        borderRadius: 10,
    },
    selectAllText: {
        fontSize: 12,
        fontFamily: Fonts.brandBold,
        color: Colors.primary,
    },

    /* Bulk Action Bar Premium */
    bulkActionFloatingContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10000,
    },
    bulkActionBarPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        gap: 16,
    },
    bulkInfo: {
        alignItems: 'center',
        paddingRight: 16,
        borderRightWidth: 1,
        borderRightColor: Colors.border,
    },
    bulkCountText: {
        fontSize: 18,
        fontFamily: Fonts.brandBlack,
        color: Colors.primary,
    },
    bulkLabelText: {
        fontSize: 10,
        fontFamily: Fonts.brandBold,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    bulkActionsRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    premiumBulkBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    premiumBulkBtnText: {
        fontSize: 14,
        fontFamily: Fonts.brandBold,
        color: isDark ? Colors.background : Colors.white,
    },
    bulkCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Modal Background */
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "flex-end",
    },
    orderCard: { /* deprecated - kept for backwards compatibility */
        borderRadius: 14,
        padding: 14,
        borderWidth: 1.5,
        backgroundColor: Colors.surface,
        borderColor: Colors.border,
    },

    /* ✨ PREMIUM ORDER CARD - Modern Design */
    premiumOrderCard: {
        backgroundColor: Colors.surface,
        borderRadius: 18,
        overflow: 'hidden',
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    orderBadge: {
        borderLeftWidth: 4,
        paddingLeft: 10,
    },
    orderBadgeText: {
        fontSize: 15,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    headerInfo: {
        flex: 1,
    },
    customerNameCard: {
        fontSize: 14,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    orderTimeCard: {
        fontSize: 12,
        fontFamily: Fonts.brand,
        color: Colors.muted,
        marginTop: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
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
        fontFamily: Fonts.brandBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    itemsSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    itemsThumbnails: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        width: 85,
    },
    itemThumbnail: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.surface,
        backgroundColor: Colors.background,
    },
    moreItemsBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 30,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    moreItemsText: {
        fontSize: 12,
        fontFamily: Fonts.brandBold,
        color: Colors.white,
    },
    itemsText: {
        flex: 1,
    },
    itemsCountCard: {
        fontSize: 14,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    itemsPreviewText: {
        fontSize: 12,
        fontFamily: Fonts.brand,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.background + "40",
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    statValue: {
        fontSize: 13,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    statDivider: {
        width: 1,
        height: 16,
        backgroundColor: Colors.border,
    },
    quickActionsBar: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    quickActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.1,
        shadowRadius: 4,
    },
    quickActionText: {
        fontSize: 13,
        fontFamily: Fonts.brandBold,
    },
    tapHint: {
        fontSize: 11,
        fontFamily: Fonts.brand,
        color: Colors.muted,
        textAlign: 'center',
        paddingVertical: 10,
        opacity: 0.7,
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
        fontFamily: Fonts.brandBold,
        color: Colors.white,
    },
    modalSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.brand,
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
        borderRadius: 20,
        padding: 20,
        marginVertical: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    statusActionContainer: {
        paddingHorizontal: 0,
        paddingVertical: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
        marginBottom: 10,
    },
    actionButtonsGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    largePrimaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    largeBtnText: {
        fontSize: 13,
        fontFamily: Fonts.brandBold,
        color: Colors.white,
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
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    customerCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        overflow: 'hidden',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    customerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerRowSeparator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    customerLabel: {
        fontSize: 12,
        color: Colors.muted,
        fontFamily: Fonts.brandMedium,
    },
    customerValue: {
        fontSize: 13,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    itemsListContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    premiumItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    premiumItemImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: Colors.background,
    },
    premiumItemDetails: {
        flex: 1,
    },
    premiumItemName: {
        fontSize: 13,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
        marginBottom: 2,
    },
    premiumItemSpecs: {
        fontSize: 11,
        fontFamily: Fonts.brand,
        color: Colors.muted,
    },
    premiumItemTotal: {
        fontSize: 14,
        fontFamily: Fonts.brandBold,
        color: Colors.primary,
    },
    summaryContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
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
        fontFamily: Fonts.brand,
        color: Colors.textSecondary,
    },
    sumValue: {
        fontSize: 13,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    totalRow: {
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    totalLabel: {
        fontSize: 14,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
    },
    totalAmount: {
        fontSize: 18,
        fontFamily: Fonts.brandBlack,
        color: Colors.primary,
    },
    metaContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    metaItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    metaItem_last: {
        borderBottomWidth: 0,
    },
    metaLabel: {
        fontSize: 12,
        color: Colors.muted,
        fontFamily: Fonts.brandMedium,
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 13,
        fontFamily: Fonts.brandBold,
        color: Colors.text,
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
        fontFamily: Fonts.brandBold,
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
