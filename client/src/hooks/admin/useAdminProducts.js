import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminAxios from "../../api/admin/adminAxios";
import {
  createProductAPI,
  getProductDetailsAPI,
  updateProductAPI,
  deleteProductAPI,
} from "../../api/admin/product.api";

export const useAdminProducts = ({ page = 1, search = "" }) => {
  return useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: async () => {
      const { data } = await adminAxios.get("/admin/products", {
        params: { page, search },
      });
      return data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProductDetails = (id) => {
  return useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data } = await getProductDetailsAPI(id);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }) => updateProductAPI({ id, data: payload }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", variables.id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};