import apiClient from "@/lib/axios";
import { OrderStatus, UpdateOrderStatusResponse, GetRestaurantOrdersResponse } from "@/types/order";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["restaurant-orders"],
      });
    },
  });
};