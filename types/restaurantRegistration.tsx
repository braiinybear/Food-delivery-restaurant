export interface RestaurantPartnerRequestBody {
    restaurantName: string;
    description: string;
    address: string;
    lat?: number;
    lng?: number;
    cuisineTypes: string[];
    costForTwo: number;
    fssaiCode: string;
    gstNumber: string;
    logoUrl: string;
    bannerUrl: string;
    fssaiDocUrl: string;
}

export interface RestaurantPartnerSuccessResponse {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  restaurantName: string;
}

export interface RestaurantApplicationResponse {
  id: string;
  userId: string;
  restaurantName: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  cuisineTypes: string[];
  costForTwo: number;
  fssaiCode: string;
  gstNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}