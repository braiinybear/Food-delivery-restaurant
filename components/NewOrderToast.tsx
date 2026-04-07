import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface NewOrderToastProps {
  orderId: string;
  customerName?: string;
  itemCount: number;
  totalAmount: number;
  paymentMode: string;
  onDismiss?: () => void;
  onPress?: () => void;
  onAccept?: (orderId: string) => void;
  duration?: number; // Auto-dismiss duration in ms (0 = manual only)
  isAccepting?: boolean; // Loading state for accept button
  queuePosition?: number; // Position in queue (1, 2, 3...)
  totalInQueue?: number; // Total orders in queue
}

const { width } = Dimensions.get('window');

/**
 * NewOrderToast: Premium new order notification
 * - Slides in from top with smooth animation
 * - Shows key order info with professional design
 * - Accept and dismiss buttons for quick action
 * - Auto-dismisses after duration
 * - Queue indicator when multiple orders arrive
 */
export function NewOrderToast({
  orderId,
  customerName,
  itemCount,
  totalAmount,
  paymentMode,
  onDismiss,
  onPress,
  onAccept,
  isAccepting = false,
  duration = 5000,
  queuePosition = 1,
  totalInQueue = 1,
}: NewOrderToastProps) {
  const [slideAnim] = useState(new Animated.Value(-150));
  const [visible, setVisible] = useState(true);

  // Slide in animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(dismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [slideAnim, duration]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const hasQueue = totalInQueue > 1;
  const paymentIcon = paymentMode === 'COD' ? 'cash' : 'wallet';
  const paymentLabel = paymentMode === 'COD' ? 'Cash' : 'Wallet';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Queue Badge - Show when multiple orders */}
      {hasQueue && (
        <View style={styles.queueBadge}>
          <Text style={styles.queueText}>
            +{totalInQueue - 1} more order{totalInQueue - 1 !== 1 ? 's' : ''} waiting
          </Text>
        </View>
      )}

      <View style={styles.toast}>
        {/* Left: Premium icon badge */}
        <View style={styles.iconBadge}>
          <View style={styles.pulseCircle} />
          <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
        </View>

        {/* Middle: Order details */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>🎉 New Order!</Text>
            {hasQueue && (
              <View style={styles.orderNumBadge}>
                <Text style={styles.orderNumText}>#{queuePosition}</Text>
              </View>
            )}
          </View>

          <Text style={styles.orderId}>Order #{orderId.slice(0, 8).toUpperCase()}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="restaurant" size={13} color="#666" />
              <Text style={styles.detail}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Ionicons name={paymentIcon} size={13} color="#666" />
              <Text style={styles.detail}>{paymentLabel}</Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amount}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Right: Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.acceptBtn, { opacity: isAccepting ? 0.6 : 1 }]}
            onPress={() => onAccept?.(orderId)}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <Ionicons name="hourglass" size={18} color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.acceptBtnText}>{isAccepting ? 'Accepting' : 'Accept'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={dismiss}
            disabled={isAccepting}
          >
            <Ionicons name="close" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  queueBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  queueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
  },
  toast: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  orderNumBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderId: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E0E0E0',
  },
  detail: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  amountLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
