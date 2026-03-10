import { useQuery } from "@tanstack/react-query";
import { fetchAdminCategories, fetchAdminSubCategories, fetchCategoriesSelection } from "../../api/admin/category.api";

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

export const useAdminCategoriesSelection = ({ level = 1, parentId = null, isForSelection = false } = {}) => {
  return useQuery({
    queryKey: ["categories-dropdown", level, parentId, isForSelection],
    queryFn: () => fetchCategoriesSelection({ level, parentId, isForSelection }),
    staleTime: 5 * 60_000,
    select: (data) => data ?? [],
  });
};

export const useAdminSubCategories = ({ parentId, isForSelection = false }) => {
  return useQuery({
    queryKey: ["admin-subcategories", parentId, isForSelection],
    queryFn: () => fetchAdminSubCategories({ parentId, isForSelection }),
    enabled: !!parentId,
    staleTime: 0,
    gcTime: 0
  });
};