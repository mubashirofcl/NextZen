// src/hooks/admin/useCategoryMutations.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../api/admin/category.api";

/* ================= CREATE ================= */

export const useCreateCategory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createAdminCategory,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-categories"],
        exact: false,
      });

      qc.invalidateQueries({
        queryKey: ["admin-subcategories"],
        exact: false,
      });
    },
  });
};

/* ================= UPDATE ================= */

export const useUpdateCategory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateAdminCategory,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-categories"],
        exact: false,
      });

      qc.invalidateQueries({
        queryKey: ["admin-subcategories"],
        exact: false,
      });
    },
  });
};

/* ================= SOFT DELETE ================= */

export const useDeleteCategory = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminCategory,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-categories"],
        exact: false,
      });

      qc.invalidateQueries({
        queryKey: ["admin-subcategories"],
        exact: false,
      });
    },
  });
};
