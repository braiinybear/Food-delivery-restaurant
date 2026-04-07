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

export const getRestaurantOrders = async (page: number = 1, limit: number = 10): Promise<GetRestaurantOrdersResponse> => {
  const { data } = await apiClient.get<GetRestaurantOrdersResponse>("/api/orders/restaurant", {
    params: { page, limit },
  });
  return data;
};


export const useRestaurantOrders = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ["restaurant-orders", page, limit],
    queryFn: () => getRestaurantOrders(page, limit),
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
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: OrderStatus;
    }) => updateOrderStatus(id, status),

    // ✅ After success → refetch fresh data
    onSuccess: (updatedOrder) => {
      try {
        // seed single-order cache so modal shows updated data immediately
        if ((updatedOrder as any)?.id) {
          queryClient.setQueryData(["order", (updatedOrder as any).id], updatedOrder as any);
          // remove from socket pending list if present
          try {
            useSocketStore.getState().removePendingOrder((updatedOrder as any).id);
          } catch (e) {
            // ignore
          }
        }

        // Merge the updated order into any cached restaurant-orders pages so UI updates instantly
        const cached = queryClient.getQueriesData({ queryKey: ["restaurant-orders"] });
        cached.forEach(([queryKey, value]) => {
          if (!value) return;
          const page = value as any;
          if (!page || !Array.isArray(page.data)) return;
          const exists = page.data.find((o: any) => o.id === (updatedOrder as any).id);
          
          let newData;
          if (exists) {
            newData = page.data.map((o: any) => 
              o.id === (updatedOrder as any).id ? { ...o, ...updatedOrder } : o
            );
          } else {
            newData = [{ ...updatedOrder }, ...page.data];
          }
          
          queryClient.setQueryData(queryKey, { ...page, data: newData });
        });
      } catch (e) {
        // fall back to invalidation if merging fails
        console.warn('Failed to merge updated order into cache, invalidating instead', e);
        queryClient.invalidateQueries({ predicate: query => query.queryKey[0] === 'restaurant-orders' });
      }
    },
  });
};