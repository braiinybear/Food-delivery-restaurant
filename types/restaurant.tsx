import { MenuCategory } from "./menu";

export interface Review {
  id?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
}
export interface Restaurant {
  id: string;
  managerId: string;
  name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  image: string | null;
  costForTwo: number;
  cuisineTypes: string[];
  address: string;
  lat: number;
  lng: number;
  isActive: boolean;
  isOpen: boolean;
  isVerified: boolean;
  rating: number;
  ratingCount: number;
  fssaiCode: string;
  gstNumber: string;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  menuCategories: MenuCategory[];
  reviews: Review[];
}

export interface UpdateRestaurantRequest{
  name?:string,
  description?:string,
  image?:string,
  costForTwo?:number,
  cuisineTypes?:string[],
  address?:string,
  lat?:number,
  lng?:number,
  fssaiCode?:string,
  gstNumber?:string,
}

export interface DeleteRestaurantResponse {
  message: string;
}

export interface RestaurantDashboardMetrics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  revenue: number;
}

export interface RestaurantDashboardPeriod {
  start: string;
  end: string;
}

export interface RestaurantDashboardResponse {
  restaurantName: string;
  period: RestaurantDashboardPeriod;
  metrics: RestaurantDashboardMetrics;
}