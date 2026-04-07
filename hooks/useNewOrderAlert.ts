import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import * as Haptics from 'expo-haptics';

interface NewOrderAlertCallbacks {
  onNewOrder?: (order: any) => void;
  onAlert?: () => void;
  onError?: (error: string) => void;
}

/**
 * useNewOrderAlert: Detects new orders and triggers alerts (vibration)
 * 
 * Features:
 * - Haptic feedback (vibration) on new order
 * - Multiple intensity levels
 * - Callback when order detected
 * - Deduplication (won't trigger twice for same order)
 */
export function useNewOrderAlert(callbacks?: NewOrderAlertCallbacks) {
  const { pendingOrders } = useSocketStore();
  const processedOrdersRef = useRef<Set<string>>(new Set());

  // Detect new orders
  useEffect(() => {
    // Find orders we haven't alerted for yet
    const newOrders = pendingOrders.filter(
      order => !processedOrdersRef.current.has(order.orderId)
    );

    if (newOrders.length === 0) return;

    // Process each new order
    for (const order of newOrders) {
      console.log('[NewOrderAlert] 🎉 NEW ORDER DETECTED:', order.orderId);
      processedOrdersRef.current.add(order.orderId);

      // Trigger alert
      triggerAlert(order);
      callbacks?.onNewOrder?.(order);
    }
  }, [pendingOrders, callbacks]);

  const triggerAlert = async (order: any) => {
    try {
      console.log('[NewOrderAlert] 📳 Triggering haptic feedback');
      
      // Vibration pattern: Heavy-tap → Medium-tap
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(r => setTimeout(r, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(r => setTimeout(r, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      callbacks?.onAlert?.();
      console.log('[NewOrderAlert] ✅ Alert triggered successfully');
    } catch (error) {
      console.error('[NewOrderAlert] ❌ Alert error:', error);
      callbacks?.onError?.('Alert trigger failed');
    }
  };

  return {
    alertedOrders: processedOrdersRef.current.size,
    clearAlertedOrders: () => processedOrdersRef.current.clear(),
  };
}
