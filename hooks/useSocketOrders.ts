import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { getSocket } from '@/lib/socket-client';

export function useSocketRestaurantOrders() {
  const { addPendingOrder, removePendingOrder, updateOrderStatus } =
    useSocketStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for new orders assigned to this restaurant
    socket.on('new_order', (data) => {
      console.log('[Restaurant] New Order:', data);
      addPendingOrder(data);
    });

    // Listen for order status change notifications
    socket.on('order_status_changed', (data) => {
      console.log('[Restaurant] Order Status Changed:', data);
      updateOrderStatus(data.orderId, data.status);
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_changed');
    };
  }, [addPendingOrder, updateOrderStatus]);
}

export function useManageRestaurantOrder(orderId: string | null) {
  const { setManagingOrder } = useSocketStore();

  useEffect(() => {
    if (!orderId) return;

    setManagingOrder(orderId);
    console.log(`[Restaurant] Managing order: ${orderId}`);

    return () => {
      setManagingOrder(null);
    };
  }, [orderId, setManagingOrder]);
}

export function useEmitOrderStatus() {
  const socket = getSocket();

  const updateStatus = (orderId: string, newStatus: string) => {
    if (!socket) return;

    socket.emit('update_order_status', {
      orderId,
      status: newStatus,
    });

    console.log(`[Restaurant] Updated order ${orderId} to ${newStatus}`);
  };

  return { updateStatus };
}
