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
import { useTheme } from '@/context/ThemeContext';

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
  const { Colors, isDark } = useTheme();
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
        <View style={[styles.queueBadge, { backgroundColor: isDark ? Colors.surface : '#FFF3E0', borderLeftColor: Colors.primary }]}>
          <Text style={[styles.queueText, { color: Colors.primary }]}>
            +{totalInQueue - 1} more order{totalInQueue - 1 !== 1 ? 's' : ''} waiting
          </Text>
        </View>
      )}

      <View style={[styles.toast, { backgroundColor: Colors.surface, borderLeftColor: Colors.primary, shadowColor: Colors.primary }]}>
        {/* Left: Premium icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: Colors.primary }]}>
          <View style={[styles.pulseCircle, { backgroundColor: Colors.primary }]} />
          <Ionicons name="checkmark-circle" size={40} color={isDark ? Colors.background : "#FFFFFF"} />
        </View>

        {/* Middle: Order details */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: Colors.text }]}>🎉 New Order!</Text>
            {hasQueue && (
              <View style={[styles.orderNumBadge, { backgroundColor: Colors.primary }]}>
                <Text style={[styles.orderNumText, { color: isDark ? Colors.background : "#FFFFFF" }]}>#{queuePosition}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.orderId, { color: Colors.muted }]}>Order #{orderId.slice(0, 8).toUpperCase()}</Text>

          <View style={[styles.detailsRow, { borderTopColor: Colors.border }]}>
            <View style={styles.detailItem}>
              <Ionicons name="restaurant" size={13} color={Colors.muted} />
              <Text style={[styles.detail, { color: Colors.muted }]}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: Colors.border }]} />
            <View style={styles.detailItem}>
              <Ionicons name={paymentIcon} size={13} color={Colors.muted} />
              <Text style={[styles.detail, { color: Colors.muted }]}>{paymentLabel}</Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={[styles.amount, { color: Colors.primary }]}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Right: Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: Colors.primary, opacity: isAccepting ? 0.6 : 1 }]}
            onPress={() => onAccept?.(orderId)}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <Ionicons name="hourglass" size={18} color={isDark ? Colors.background : "#FFFFFF"} />
            ) : (
              <Ionicons name="checkmark-done" size={18} color={isDark ? Colors.background : "#FFFFFF"} />
            )}
            <Text style={[styles.acceptBtnText, { color: isDark ? Colors.background : "#FFFFFF" }]}>{isAccepting ? 'Accepting' : 'Accept'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: Colors.background, borderColor: Colors.border }]}
            onPress={dismiss}
            disabled={isAccepting}
          >
            <Ionicons name="close" size={18} color={Colors.muted} />
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'center',
    borderLeftWidth: 3,
  },
  queueText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toast: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    borderLeftWidth: 4,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    flex: 1,
  },
  orderNumBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderNumText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderId: {
    fontSize: 12,
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
  },
  detail: {
    fontSize: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 90,
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
