import { useCallback } from 'react';
import apiClient from '@/lib/axios';
import { useSocketStore } from '@/store/useSocketStore';

/**
 * useAcceptOrder: Handles accepting a new order
 * 
 * Flow:
 * 1. Call PATCH /api/orders/{id}/status with status='ACCEPTED'
 * 2. Backend validates and updates database
 * 3. Backend emits socket event to customers
 * 4. Remove from pending orders in socket store
 */
export function useAcceptOrder() {
  const { removePendingOrder } = useSocketStore();

  const acceptOrder = useCallback(
    async (orderId: string) => {
      try {
        console.log(`[AcceptOrder] 🤝 Attempting to accept order: ${orderId}`);

        // Call API to accept order
        const response = await apiClient.patch(`/api/orders/${orderId}/status`, {
          status: 'ACCEPTED',
        });

        console.log(`[AcceptOrder] ✅ Order accepted successfully`);
        console.log(`[AcceptOrder]    Order ID: ${response.data?.id}`);
        console.log(`[AcceptOrder]    New Status: ${response.data?.status}`);

        // Remove from pending orders
        removePendingOrder(orderId);
        console.log(`[AcceptOrder] 🗑️  Removed from pending orders`);

        return response.data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AcceptOrder] ❌ Failed to accept order:`, errorMsg);
        throw error;
      }
    },
    [removePendingOrder]
  );

  return { acceptOrder };
}
