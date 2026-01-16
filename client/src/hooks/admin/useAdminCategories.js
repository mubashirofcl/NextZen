// src/hooks/admin/useAdminCategories.js
import { useQuery } from "@tanstack/react-query";
import { fetchAdminCategories } from "../../api/admin/category.api";

export const useAdminCategories = ({
  page = 1,
  search = "",
  status = "active",
  level = 1,
  parentId = null,
}) => {
  return useQuery({
    queryKey: ["admin-categories", page, search, status, level, parentId],
    queryFn: () =>
      fetchAdminCategories({
        page,
        search,
        status,
        level,
        parentId,
      }),
    keepPreviousData: true,
    staleTime: 30_000,
  });
};
