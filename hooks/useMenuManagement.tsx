import apiClient from "@/lib/axios";
import { CreateMenuCategoryRequest, CreateMenuCategoryResponse, CreateMenuItemRequest, DeleteMenuCategoryResponse, 
    DeleteMenuItemResponse, MenuCategory, MenuItem, 
    UpdateMenuCategoryRequest, UpdateMenuItemRequest } from "@/types/menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// used to get all the menuCategories of the Restaurant by its id
export const getMenuCategories = async (
    restaurantId: string
): Promise<MenuCategory[]> => {
   
    
    const response = await apiClient.get(
        `/api/menu-categories/restaurant/${restaurantId}`
    );
    
    return response.data as MenuCategory[];
};
export const useMenuCategories = (restaurantId: string) => {
    return useQuery({
        queryKey: ["menuCategories", restaurantId],
        queryFn: () => getMenuCategories(restaurantId),
        enabled: !!restaurantId,
        staleTime: 1000 * 60 * 5,
    });
};

// used to create a new menu category by the restaurant manager
export const createMenuCategory = async (
    body: CreateMenuCategoryRequest
): Promise<CreateMenuCategoryResponse> => {
    const response = await apiClient.post(
        "/api/menu-categories",
        body
    );

    return response.data as CreateMenuCategoryResponse;
};
export const useCreateMenuCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createMenuCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["menuCategories"],
            });
        },
    });
};

// used to get a single menu category by id
export const getMenuCategoryById = async (
    categoryId: string
): Promise<MenuCategory> => {
    const response = await apiClient.get(
        `/api/menu-categories/${categoryId}`
    );

    return response.data as MenuCategory;
};
export const useMenuCategory = (categoryId: string) => {
    return useQuery({
        queryKey: ["menuCategory", categoryId],
        queryFn: () => getMenuCategoryById(categoryId),
        enabled: !!categoryId,
        staleTime: 1000 * 60 * 5,
    });
};


// used to update menucategory by its id
export const updateMenuCategory = async (
    id: string,
    body: UpdateMenuCategoryRequest
): Promise<MenuCategory> => {
    const response = await apiClient.patch(
        `/api/menu-categories/${id}`,
        body
    );

    return response.data as MenuCategory;
};

export const useUpdateMenuCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string;
            body: UpdateMenuCategoryRequest;
        }) => updateMenuCategory(id, body),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
            queryClient.invalidateQueries({ queryKey: ["menuCategory"] });
        },
    });
};
// used to delete a category
export const deleteMenuCategory = async (
    id: string
): Promise<DeleteMenuCategoryResponse> => {
    const response = await apiClient.delete(`/api/menu-categories/${id}`);

    return response.data as DeleteMenuCategoryResponse;
};

export const useDeleteMenuCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteMenuCategory(id),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
            queryClient.invalidateQueries({ queryKey: ["menuCategory"] });
            queryClient.invalidateQueries({ queryKey: ["restaurantMenuItems"] });
        },
    });
};


// used to get all menuItems of a restaurant
export const getRestaurantMenuItems = async (
    restaurantId: string
): Promise<MenuItem[]> => {
    const response = await apiClient.get(
        `/api/menu-items/restaurant/${restaurantId}`
    );

    return response.data as MenuItem[];
};
export const useRestaurantMenuItems = (restaurantId: string) => {
    return useQuery({
        queryKey: ["restaurantMenuItems", restaurantId],
        queryFn: () => getRestaurantMenuItems(restaurantId),
        enabled: !!restaurantId,
        staleTime: 1000 * 60 * 5,
    });
};

// used to get the menu item by its id
export const getMenuItemById = async (
    id: string
): Promise<MenuItem> => {
    const response = await apiClient.get(`/api/menu-items/${id}`);

    return response.data as MenuItem;
};
export const useMenuItem = (id: string) => {
    return useQuery({
        queryKey: ["menuItem", id],
        queryFn: () => getMenuItemById(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
};

//used to update the menu-item by id
export const updateMenuItem = async (
    id: string,
    body: UpdateMenuItemRequest
): Promise<MenuItem> => {
    const response = await apiClient.patch(
        `/api/menu-items/${id}`,
        body
    );

    return response.data as MenuItem;
};

export const useUpdateMenuItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            body,
        }: {
            id: string;
            body: UpdateMenuItemRequest;
        }) => updateMenuItem(id, body),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["restaurantMenuItems"] });
            queryClient.invalidateQueries({ queryKey: ["menuItem"] });
            queryClient.invalidateQueries({ queryKey: ["menuCategory"] });
        },
    });
};

// used to delete a menu item by id
export const deleteMenuItem = async (
    id: string
): Promise<DeleteMenuItemResponse> => {
    const response = await apiClient.delete(`/api/menu-items/${id}`);

    return response.data as DeleteMenuItemResponse;
};
export const useDeleteMenuItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteMenuItem(id),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["restaurantMenuItems"] });
            queryClient.invalidateQueries({ queryKey: ["menuItem"] });
            queryClient.invalidateQueries({ queryKey: ["menuCategory"] });
        },
    });
};


export const createMenuItem = async (
  body: CreateMenuItemRequest
): Promise<MenuItem> => {
  const response = await apiClient.post("/api/menu-items", body);

  return response.data as MenuItem;
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMenuItem,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantMenuItems"] });
      queryClient.invalidateQueries({ queryKey: ["menuCategory"] });
      queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
    },
  });
};