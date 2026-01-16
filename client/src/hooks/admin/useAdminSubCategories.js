import { useQuery } from "@tanstack/react-query";
import { fetchAdminSubCategories } from "../../api/admin/category.api";

export const useAdminSubCategories = ({ parentId }) => {
    return useQuery({
        queryKey: ["admin-subcategories", parentId],
        queryFn: () =>
            fetchAdminSubCategories({ parentId }),
        enabled: !!parentId,
    });
};
