import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/axios";
import {
  RestaurantApplicationResponse,
  RestaurantPartnerRequestBody,
  RestaurantPartnerSuccessResponse,
} from "../types/restaurantRegistration";
import { useRestaurantLocation } from "./useRestaurantLocation";
import { Restaurant, RestaurantDashboardResponse, UpdateRestaurantRequest } from "@/types/restaurant";

export const getMyRestaurantApplication =
  async (): Promise<RestaurantApplicationResponse> => {
    const response = await apiClient.get("/api/partner-requests/restaurant/me");

    return response.data as RestaurantApplicationResponse;
  };
export const useMyRestaurantApplication = () => {
  return useQuery({
    queryKey: ["myRestaurantApplication"],
    queryFn: getMyRestaurantApplication,
    staleTime: 1000 * 60 * 10,
  });
};
//......................................................................
export const useSubmitRestaurantPartnerRequest = () => {
  const { coords } = useRestaurantLocation();

  const submitRestaurantPartnerRequest = async (
    body: RestaurantPartnerRequestBody,
  ): Promise<RestaurantPartnerSuccessResponse> => {
    const payload = {
      ...body,
      ...(coords && {
        lat: coords.lat,
        lng: coords.lng,
      }),
    };

    const response = await apiClient.post(
      "/api/partner-requests/restaurant",
      payload,
    );
    console.log(response.data);

    return response.data;
  };

  return useMutation({
    mutationFn: submitRestaurantPartnerRequest,
  });
};

// used to get my restaurant details after my restaurant partner request is approved and restaurant is created
export const getMyRestaurant = async (): Promise<Restaurant> => {
  const response = await apiClient.get("/api/restaurants/me");

  return response.data as Restaurant;
};

export const useMyRestaurant = () => {
  return useQuery({
    queryKey: ["myRestaurant"],
    queryFn: getMyRestaurant,
    staleTime: 1000 * 60 * 10,
  });
};

// used to update my restaurant details in restaurant profile screen
export const updateRestaurant = async (
  id: string,
  body: UpdateRestaurantRequest,
): Promise<Restaurant> => {
  const response = await apiClient.patch(`/api/restaurants/${id}`, body);

  return response.data as Restaurant;
};

export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();
  const { coords } = useRestaurantLocation();

  const updateRestaurantWithLocation = async ({
    id,
    body,
  }: {
    id: string;
    body: UpdateRestaurantRequest;
  }) => {
    const payload = {
      ...body,
      ...(coords && {
        lat: coords.lat,
        lng: coords.lng,
      }),
    };

    return updateRestaurant(id, payload);
  };

  return useMutation({
    mutationFn: updateRestaurantWithLocation,

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["restaurant", variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["myRestaurant"],
      });
    },
  });
};



export const deleteRestaurant = async (
  id: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/api/restaurants/${id}`);

  return response.data;
};

export const useDeleteRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRestaurant(id),

    onSuccess: () => {
      // remove cached restaurant data
      queryClient.invalidateQueries({
        queryKey: ["myRestaurant"],
      });

      queryClient.invalidateQueries({
        queryKey: ["restaurant"],
      });
    },
  });
};


export const getRestaurantDashboard = async (
  startDate?: string,
  endDate?: string
): Promise<RestaurantDashboardResponse> => {

  const params: Record<string, string> = {};

  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiClient.get("/api/restaurants/dashboard", {
    params,
  });

  return response.data as RestaurantDashboardResponse;
};


export const useRestaurantDashboard = (
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ["restaurantDashboard", startDate, endDate],
    queryFn: () => getRestaurantDashboard(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};