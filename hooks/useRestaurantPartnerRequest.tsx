import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../lib/axios";
import {
    RestaurantApplicationResponse,
    RestaurantPartnerRequestBody,
    RestaurantPartnerSuccessResponse,
} from "../types/restaurantRegistration";
import { useRestaurantLocation } from "./useRestaurantLocation";

export const getMyRestaurantApplication =
    async (): Promise<RestaurantApplicationResponse> => {
        const response = await apiClient.get(
            "/api/partner-requests/restaurant/me"
        );

        return response.data as RestaurantApplicationResponse;
    };
export const useMyRestaurantApplication = () => {
    return useQuery({
        queryKey: ["myRestaurantApplication"],
        queryFn: getMyRestaurantApplication,
    });
};
export const useSubmitRestaurantPartnerRequest = () => {
    const { coords } = useRestaurantLocation();

    const submitRestaurantPartnerRequest = async (
        body: RestaurantPartnerRequestBody
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
            payload
        );
        console.log(response.data);

        return response.data;
    };

    return useMutation({
        mutationFn: submitRestaurantPartnerRequest,
    });
};
