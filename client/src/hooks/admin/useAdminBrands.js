import { useQuery } from "@tanstack/react-query";
import { fetchAdminBrands, fetchAdminBrandsSelection } from "../../api/admin/brands.api";


export const useAdminBrands = ({ page, search, isActive }) => {
    return useQuery({
        queryKey: ["admin-brands", page, search, isActive],
        queryFn: () =>
            fetchAdminBrands({
                page,
                search,
                isActive,
            }),
        keepPreviousData: true,
        select: (res) => res.data,
    });
};

export const useAdminBrandsSelection = () => {
    return useQuery({
        queryKey: ["admin-brands-selection"],
        queryFn: fetchAdminBrandsSelection,
        select: (res) => res.data || [],
    });
};