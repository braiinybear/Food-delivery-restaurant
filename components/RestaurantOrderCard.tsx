import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts, FontSize } from '@/constants/typography';
import { useUpdateOrderStatus, getAllowedTransitions } from '@/hooks/useOrders';
import { OrderStatus } from '@/types/order';

interface RestaurantOrderCardProps {
  orderId: string;
  customerId?: string;
  totalPrice?: number;
  itemsCount?: number;
  paymentMode?: string;
  status?: OrderStatus; // Added status prop for better reliability
}

/**
 * RestaurantOrderCard: Premium Order Card Component
 * Fixed: Resolved 'orders' property error by using optimized hooks and proper prop handling.
 */
export function RestaurantOrderCard({
  orderId,
  totalPrice = 0,
  itemsCount = 0,
  paymentMode = 'CASH',
  status = 'PLACED',
}: RestaurantOrderCardProps) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();

  const currentStatus = status;
  const allowedTransitions = getAllowedTransitions(currentStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return Colors.primary;
      case 'ACCEPTED': return Colors.success;
      case 'PREPARING': return Colors.warning;
      case 'READY': return '#3498DB'; // Using blue for Ready
      case 'CANCELLED': return Colors.danger;
      default: return Colors.muted;
    }
  };

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    updateStatus({ id: orderId, status: newStatus });
  };

  return (
    <View style={styles.container}>
      {/* Header with Order ID and Status */}
      <View style={styles.header}>
        <View style={styles.idSection}>
          <Text style={styles.idLabel}>ORDER ID</Text>
          <Text style={styles.idValue}>#{orderId.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(currentStatus) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>
            {currentStatus}
          </Text>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.content}>
        <View style={styles.billSection}>
          <View style={styles.infoItem}>
            <Ionicons name="receipt-outline" size={14} color={Colors.muted} />
            <Text style={styles.itemsLabel}>{itemsCount} Items</Text>
          </View>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>{paymentMode}</Text>
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalPrice.toFixed(0)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {allowedTransitions.length > 0 && (
        <View style={styles.actionsBar}>
          {allowedTransitions.slice(0, 2).map((transition) => (
            <TouchableOpacity
              key={transition}
              style={[styles.actionButton, { backgroundColor: Colors.primary }]}
              onPress={() => handleStatusUpdate(transition as OrderStatus)}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                  <Text style={styles.actionButtonText}>
                    {transition.charAt(0) + transition.slice(1).toLowerCase()}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleStatusUpdate('CANCELLED')}
            disabled={isPending}
          >
            <Ionicons name="close-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  idSection: {
    flexDirection: 'column',
  },
  idLabel: {
    fontSize: 10,
    fontFamily: Fonts.brandBold,
    color: Colors.muted,
    letterSpacing: 1,
  },
  idValue: {
    fontSize: 16,
    fontFamily: Fonts.brandBlack,
    color: Colors.text,
  },
  statusBadge: {
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
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.brandBold,
    textTransform: 'uppercase',
  },
  content: {
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2F2F7',
  },
  billSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsLabel: {
    fontSize: 13,
    fontFamily: Fonts.brandMedium,
    color: Colors.textSecondary,
  },
  paymentBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 10,
    fontFamily: Fonts.brandBold,
    color: Colors.muted,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: Fonts.brandBold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: Fonts.brandBlack,
    color: Colors.primary,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Fonts.brandBold,
    color: Colors.white,
  },
  cancelBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.danger + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
