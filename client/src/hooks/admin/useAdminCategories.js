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


export const useAdminCategoriesSelection = ({ level = 1, parentId = null } = {}) => {
  return useQuery({
    queryKey: ["categories-dropdown", level, parentId],
    queryFn: () => fetchCategoriesSelection({ level, parentId }),
    staleTime: 5 * 60_000,
    select: (data) => data ?? [],
  });
};

export const useAdminSubCategories = ({ parentId }) => {
  return useQuery({
    queryKey: ["admin-subcategories", parentId],
    queryFn: () => fetchAdminSubCategories({ parentId }), 
    enabled: !!parentId, 
    staleTime: 0,  
    gcTime: 0      
  });
};