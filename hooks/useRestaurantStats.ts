import apiClient from "@/lib/axios";
import { RestaurantStatsResponse } from "@/types/stats";
import { useQuery } from "@tanstack/react-query";

const PERIODS = ["Today", "Week", "Month", "Year"] as const;
export type StatsPeriod = (typeof PERIODS)[number];

export const getRestaurantStats = async (
  period: StatsPeriod = "Week"
): Promise<RestaurantStatsResponse> => {
  const { data } = await apiClient.get<RestaurantStatsResponse>(
    "/api/restaurants/stats",
    { params: { period } }
  );
  return data;
};

export const useRestaurantStats = (period: StatsPeriod = "Week") => {
  return useQuery({
    queryKey: ["restaurant-stats", period],
    queryFn: () => getRestaurantStats(period),
  });
};
