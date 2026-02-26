import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  fetchAdminSubCategories,
} from "../../api/admin/category.api";


export const useCreateCategory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
      qc.invalidateQueries({ queryKey: ["categories-selection"] });
    },
  });
};


export const useUpdateCategory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateAdminCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
      qc.invalidateQueries({ queryKey: ["categories-dropdown"] });
      qc.invalidateQueries({ queryKey: ["categories-selection"] });
    },
  });
};



export const useDeleteCategory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
    },
  });
};


export const useAdminSubCategories = (params) => {
  return useQuery({
    queryKey: ["admin-subcategories", params?.parentId],
    queryFn: () => fetchAdminSubCategories(params),
    enabled: !!params?.parentId, 
    staleTime: 5 * 60 * 1000, 
  });
};