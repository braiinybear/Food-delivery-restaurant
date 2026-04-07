import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import apiClient from '@/lib/axios';
import { getSocket } from '@/lib/socket-client';

/**
 * useOrderPolling: Fallback polling when socket is disconnected
 * 
 * When socket is DOWN:
 * - Polls API every 10 seconds for new orders
 * - Polls API for current order status updates
 * - Updates store with received data
 * 
 * When socket is UP:
 * - Stops polling (socket handles real-time updates)
 */
export function useOrderPolling() {
  const { 
    isConnected, 
    handleNewOrder, 
    handleOrderStatusUpdate,
    managingOrderId,
    // pendingOrders,
  } = useSocketStore();

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchedOrdersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // If socket is connected, don't poll
    if (isConnected) {
      if (pollingIntervalRef.current) {
        console.log('[OrderPolling] 🔌 Socket connected - Stopping polling');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Socket is disconnected - Start polling
    console.log('[OrderPolling] 📡 Socket disconnected - Starting fallback polling (every 10s)');

    const pollOrders = async () => {
      try {
        // 1. Fetch new orders for this restaurant
        console.log('[OrderPolling] 🔄 Polling for new orders...');
        const ordersResponse = await apiClient.get('/api/orders', {
          params: { 
            status: 'PLACED,ACCEPTED,PREPARING',
            limit: 50 
          },
        });

        const orders = ordersResponse.data?.data || [];
        console.log(`[OrderPolling] 📊 API returned ${orders.length} orders`);
        
        for (const order of orders) {
          // Only add if we haven't seen it yet
          if (!lastFetchedOrdersRef.current.has(order.id)) {
            console.log('[OrderPolling] ✨ New order discovered:', order.id);
            lastFetchedOrdersRef.current.add(order.id);
            handleNewOrder({
              orderId: order.id,
              customerId: order.customerId,
              items: order.items || [],
              totalAmount: order.totalAmount,
              itemCount: order.items?.length || 0,
              paymentMode: order.paymentMode,
              timestamp: new Date().toISOString(),
            });
          } else {
            console.log(`[OrderPolling] ℹ️  Order ${order.id} already in fetch history`);
          }
        }
        console.log(`[OrderPolling] 📈 Total unique orders ever fetched: ${lastFetchedOrdersRef.current.size}`);

        // 2. If managing an order, poll for status updates
        if (managingOrderId) {
          console.log(`[OrderPolling] 🔄 Polling for status of order: ${managingOrderId}`);
          const orderResponse = await apiClient.get(`/api/orders/${managingOrderId}`);
          if (orderResponse.data?.data?.status) {
            handleOrderStatusUpdate(managingOrderId, orderResponse.data.data.status);
            console.log(`[OrderPolling] 📦 Status updated: ${orderResponse.data.data.status}`);
          }
        }

      } catch (error) {
        console.error('[OrderPolling] ❌ Polling error:', error instanceof Error ? error.message : error);
      }
    };

    // Start polling
    pollingIntervalRef.current = setInterval(pollOrders, 10000); // Poll every 10s

    // Initial poll
    pollOrders();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isConnected, handleNewOrder, handleOrderStatusUpdate, managingOrderId]);

  return {
    isPolling: !isConnected,
  };
}
