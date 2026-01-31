import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../../api/user/products.api";

export const useProducts = ({
    search = "",
    page = 1,
    limit = 10,
    sort = "",
    category = "",
    subcategory = "",
    size = "",
    brand = "",
    minPrice = "",
    maxPrice = "",
    isFeatured = "",
}) => {
    return useQuery({
        queryKey: [
            "products",
            {
                search,
                page,
                limit,
                sort,
                category,
                subcategory,
                brand,
                size,
                minPrice,
                maxPrice,
                isFeatured
            },
        ],
        queryFn: () =>
            fetchProducts({
                search,
                page,
                limit,
                sort,
                category,
                subcategory,
                size,
                brand,
                minPrice,
                maxPrice,
                isFeatured
            }),
        keepPreviousData: true,
        staleTime: 1000 * 30,
    });
};