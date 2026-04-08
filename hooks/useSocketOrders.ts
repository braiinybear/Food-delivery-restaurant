import { useCallback, useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { getSocket } from '@/lib/socket-client';
import apiClient from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';

/**
 * useSocketRestaurantOrders: Registers socket event listeners for restaurant.
 * It tolerates the socket object being created before the actual `connect`
 * event fires by waiting and registering listeners on connect when needed.
 */
export function useSocketRestaurantOrders() {
  const queryClient = useQueryClient();
  const {
    handleNewOrder,
    handleOrderStatusUpdate,
    handleDriverAssigned,
    isConnected,
  } = useSocketStore();

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.log('[Restaurant] Socket not initialized yet - listener registration skipped');
      return;
    }

    const handleNewOrderEvent = (data: any) => {
      console.log('[Restaurant] new_order received:', data.orderId);
      handleNewOrder(data);
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
    };

    const handleOrderStatusUpdateEvent = (data: any) => {
      console.log('[Restaurant] order_status_update received:', data.orderId, data.status);
      handleOrderStatusUpdate(data.orderId, data.status);
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", data.orderId] });
    };

    const handleDriverAssignedEvent = (data: any) => {
      console.log('[Restaurant] driver_assigned received:', data.orderId);
      handleDriverAssigned(data.orderId, data.driver);
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", data.orderId] });
    };

    let listenersRegistered = false;

    const registerListeners = () => {
      if (listenersRegistered) {
        return;
      }

      if (!socket.connected) {
        console.log(
          `[Restaurant] Waiting for socket connection before registering listeners. socket.connected=${socket.connected}, isConnected=${isConnected}`,
        );
        return;
      }

      socket.on('new_order', handleNewOrderEvent);
      socket.on('order_status_update', handleOrderStatusUpdateEvent);
      socket.on('driver_assigned', handleDriverAssignedEvent);
      listenersRegistered = true;

      console.log('[Restaurant] Socket listeners registered');
    };

    const handleSocketConnect = () => {
      console.log('[Restaurant] Socket connected event received - registering listeners');
      registerListeners();
    };

    registerListeners();
    socket.on('connect', handleSocketConnect);

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('new_order', handleNewOrderEvent);
      socket.off('order_status_update', handleOrderStatusUpdateEvent);
      socket.off('driver_assigned', handleDriverAssignedEvent);
      listenersRegistered = false;
      console.log('[Restaurant] Socket listeners cleaned up');
    };
  }, [isConnected, handleDriverAssigned, handleNewOrder, handleOrderStatusUpdate]);
}

/**
 * useManageRestaurantOrder: Manages socket room subscription for order being managed
 * Joins room when restaurant starts managing order, leaves when done
 */
export function useManageRestaurantOrder(orderId: string | null) {
  const { setManagingOrder } = useSocketStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log('[Restaurant] Socket not initialized - cannot join room');
      return;
    }

    if (!orderId) {
      console.log('[Restaurant] No order ID provided - skipping room join');
      return;
    }

    console.log(`[Restaurant] Joining order management room: ${orderId}`);
    socket.emit('join_order_tracking', orderId);
    setManagingOrder(orderId);
    console.log(`[Restaurant] Successfully joined room for order: ${orderId}`);

    return () => {
      console.log(`[Restaurant] Leaving order management room: ${orderId}`);
      socket.emit('leave_order_tracking', orderId);
      setManagingOrder(null);
      console.log(`[Restaurant] Successfully left room for order: ${orderId}`);
    };
  }, [orderId, setManagingOrder]);
}

/**
 * useEmitOrderStatus: Updates order status via API.
 */
export function useEmitOrderStatus() {
  const updateStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      console.log(`[Restaurant] Sending status update via API: ${orderId} -> ${newStatus}`);

      try {
        const response = await apiClient.patch(`/api/orders/${orderId}/status`, {
          status: newStatus,
        });

        console.log(`[Restaurant] API status update successful: ${response.data.id} -> ${response.data.status}`);
        return response.data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log('[Restaurant] Error updating status:', errorMsg);

        if (error && typeof error === 'object') {
          if ('response' in error && error.response) {
            const axiosError = error as any;
            console.log('[Restaurant] Error response status:', axiosError.response.status);
            console.log('[Restaurant] Error response data:', JSON.stringify(axiosError.response.data, null, 2));
          }
          if ('config' in error) {
            const axiosError = error as any;
            console.log('[Restaurant] Request URL:', axiosError.config.url);
            console.log('[Restaurant] Request Data:', JSON.stringify(axiosError.config.data, null, 2));
          }
        }

        throw error;
      }
    },
    [],
  );

  const testUpdate = async () => {
    console.log('[Restaurant][TEST] Testing status update...');
    try {
      await updateStatus('test-order-id', 'PREPARING');
      console.log('[Restaurant][TEST] Success');
    } catch (err) {
      console.log('[Restaurant][TEST] Failed:', err);
    }
  };

  return { updateStatus, testUpdate };
}
