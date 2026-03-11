export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: "VEG" | "NON_VEG" | "EGG" | "VEGAN" | string;
  isAvailable: boolean;
  isBestseller: boolean;
  spiceLevel: "Low" | "Medium" | "High" | string;
  prepTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  restaurantId: string;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
}


export interface CreateMenuCategoryRequest {
  name: string;
}

export interface CreateMenuCategoryResponse {
  id: string;
  name: string;
  restaurantId: string;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  items: MenuItem[];
}

export interface UpdateMenuCategoryRequest {
  name: string;
}

export interface DeleteMenuCategoryResponse {
  id: string;
  name: string;
  restaurantId: string;
  type: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMenuItemRequest {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number;
  type?: "VEG" | "NON_VEG" | "EGG" | "VEGAN" | string;
  image?: string;
  isBestseller?: boolean;
  spiceLevel?: "Low" | "Medium" | "High" | string;
  prepTime?: number;
}
export interface DeleteMenuItemResponse {
  message: string;
}

export interface CreateMenuItemRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  type: "VEG" | "NON_VEG" | "EGG" | "VEGAN" | string;
  image: string;
  isBestseller: boolean;
  spiceLevel: "Low" | "Medium" | "High" | string;
  prepTime: number;
}