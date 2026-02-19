import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  fetchAdminSubCategories,
} from "../../api/admin/category.api";

/* ================= CREATE ================= */

export const useCreateCategory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      // Invalidate both levels to ensure counts and offers sync
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-subcategories"] });
      qc.invalidateQueries({ queryKey: ["categories-selection"] });
    },
  });
};

/* ================= UPDATE ================= */

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

/* ================= SOFT DELETE ================= */

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

/* ================= SUBCATEGORY FETCH ================= */

/**
 * Fetches subcategories based on parentId.
 * Used in the SubCategoryModal to show the "Database Registry" list.
 */
export const useAdminSubCategories = (params) => {
  return useQuery({
    queryKey: ["admin-subcategories", params?.parentId],
    queryFn: () => fetchAdminSubCategories(params),
    enabled: !!params?.parentId, // Only fetch if we have a parent
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 mins
  });
};