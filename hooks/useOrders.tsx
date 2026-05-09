import apiClient from "@/lib/axios";
import { OrderStatus, UpdateOrderStatusResponse, GetRestaurantOrdersResponse } from "@/types/order";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/store/useSocketStore";

// ✅ Allowed status transitions from backend
const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PLACED: ['ACCEPTED', 'CANCELLED', 'REFUSED'],
  ACCEPTED: ['PREPARING', 'CANCELLED', 'REFUSED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['ON_THE_WAY', 'PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['ON_THE_WAY', 'DELIVERED'],
  ON_THE_WAY: ['DELIVERED'],
};

// ✅ Helper function to get allowed transitions for a status
export const getAllowedTransitions = (currentStatus: OrderStatus): OrderStatus[] => {
  return allowedTransitions[currentStatus] || [];
};

// ✅ Helper to check if transition is allowed
export const isTransitionAllowed = (
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean => {
  const allowed = getAllowedTransitions(fromStatus);
  return allowed.includes(toStatus);
};

export const getRestaurantOrders = async (
  page: number = 1, 
  limit: number = 10,
  status?: string
): Promise<GetRestaurantOrdersResponse> => {
  const { data } = await apiClient.get<GetRestaurantOrdersResponse>("/api/orders/restaurant", {
    params: { page, limit, status },
  });
  return data;
};


export const useRestaurantOrders = (
  page: number = 1, 
  limit: number = 10,
  status?: string
) => {
  return useQuery({
    queryKey: ["restaurant-orders", page, limit, status],
    queryFn: () => getRestaurantOrders(page, limit, status),
  });
};

// ✅ Fetch single order by id
export const getOrderById = async (id: string) => {
  const { data } = await apiClient.get(`/api/orders/${id}`);
  return data as any;
};

export const useOrderById = (id?: string | null) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id as string),
    enabled: !!id,
    staleTime: 1000 * 30, // 30s freshness
  });
};
// .......................................................
export const updateOrderStatus = async (
  id: string,
  status: OrderStatus
): Promise<UpdateOrderStatusResponse> => {
  const { data } = await apiClient.patch(
    `/api/orders/${id}/status`,
    { status }
  );

  return data;
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),

    // ✅ OPTIMISTIC UPDATE: Instant UI transition
    onMutate: async ({ id, status: newStatus }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["restaurant-orders"] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueriesData({ queryKey: ["restaurant-orders"] });

      // Optimistically update to the new value
      const queries = queryClient.getQueriesData({ queryKey: ["restaurant-orders"] });
      queries.forEach(([queryKey, oldData]) => {
        if (!oldData) return;
        const statusInQuery = (queryKey as any)[3];
        const page = oldData as any;
        if (!page.data || !Array.isArray(page.data)) return;

        const order = page.data.find((o: any) => o.id === id);
        if (!order) return;

        let newData;
        if (statusInQuery === newStatus) {
           newData = [{ ...order, status: newStatus }, ...page.data];
        } else {
           newData = page.data.filter((o: any) => o.id !== id);
        }
        queryClient.setQueryData(queryKey, { ...page, data: newData });
      });

      return { previousOrders };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        context.previousOrders.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },

    // Always refetch after error or success to guarantee sync with server
    onSettled: (data) => {
      if (data && (data as any).id) {
         queryClient.setQueryData(["order", (data as any).id], data);
      }
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
    },
  });
};

export const bulkUpdateOrderStatus = async (
  orderIds: string[],
  status: OrderStatus
): Promise<any> => {
  const { data } = await apiClient.post(
    `/api/orders/bulk-status`,
    { orderIds, status }
  );

  return data;
};

export const useBulkUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: string[]; status: OrderStatus }) => 
      bulkUpdateOrderStatus(orderIds, status),

    // ✅ OPTIMISTIC UPDATE: Instant UI transition for bulk
    onMutate: async ({ orderIds, status: newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["restaurant-orders"] });
      const previousOrders = queryClient.getQueriesData({ queryKey: ["restaurant-orders"] });

      const queries = queryClient.getQueriesData({ queryKey: ["restaurant-orders"] });
      queries.forEach(([queryKey, oldData]) => {
        if (!oldData) return;
        const statusInQuery = (queryKey as any)[3];
        const page = oldData as any;
        if (!page.data || !Array.isArray(page.data)) return;

        let newData = [...page.data];
        let changed = false;

        // If it's NOT the target status bucket, REMOVE all matching IDs
        if (statusInQuery !== newStatus) {
          const originalLength = newData.length;
          newData = newData.filter(o => !orderIds.includes(o.id));
          if (newData.length !== originalLength) changed = true;
        } else {
          // Note: We don't usually "add" to the next tab optimistically for bulk 
          // because we don't have all the full order objects handy easily,
          // but REMOVING from the current tab is what makes it feel fast!
        }

        if (changed) {
          queryClient.setQueryData(queryKey, { ...page, data: newData });
        }
      });

      return { previousOrders };
    },

    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        context.previousOrders.forEach(([queryKey, value]) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
    },
  });
};