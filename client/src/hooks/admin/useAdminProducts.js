import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminAxios from "../../api/admin/adminAxios";
import {
  createProductAPI,
  getProductDetailsAPI,
  updateProductAPI,
  deleteProductAPI,
} from "../../api/admin/product.api";

/* -----------------------------------------------------------
   1. FETCH ALL PRODUCTS (ADMIN LIST)
----------------------------------------------------------- */
export const useAdminProducts = ({ page = 1, search = "" }) => {
  return useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: async () => {
      const { data } = await adminAxios.get("/admin/products", {
        params: { page, search },
      });
      return data;
    },
    // Keeps current UI visible while fetching next page/search results
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/* -----------------------------------------------------------
   2. FETCH SINGLE PRODUCT DETAILS (FOR EDIT MODE)
----------------------------------------------------------- */
export const useProductDetails = (id) => {
  return useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data } = await getProductDetailsAPI(id);
      // Return data directly (assuming API returns the product object)
      return data;
    },
    enabled: !!id, // Only run if ID exists
    staleTime: 1000 * 30, // 30 seconds
  });
};

/* -----------------------------------------------------------
   3. CREATE NEW PRODUCT
----------------------------------------------------------- */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductAPI,
    onSuccess: () => {
      // Refresh the product list so the new product appears
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

/* -----------------------------------------------------------
   4. UPDATE EXISTING PRODUCT (SYNC VARIANTS)
----------------------------------------------------------- */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Receives { id, ...formData } from the component
    mutationFn: ({ id, ...payload }) =>
      updateProductAPI({ id, data: payload }),

    onSuccess: (response, variables) => {
      // 1. Refresh the main product list
      queryClient.invalidateQueries({
        queryKey: ["admin-products"],
      });

      // 2. Refresh the specific product details in cache
      queryClient.invalidateQueries({
        queryKey: ["admin-product", variables.id],
      });
    },
  });
};

/* -----------------------------------------------------------
   5. DELETE PRODUCT (SOFT DELETE)
----------------------------------------------------------- */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};