import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedProducts } from "../../api/user/products.api";

export const useRecommended = (subcategoryId, currentProductId) => {
    const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    return useQuery({
        queryKey: ["recommended", subcategoryId, currentProductId],
        queryFn: () => fetchRecommendedProducts(subcategoryId, currentProductId),
        enabled: !!subcategoryId && 
                 isValidId(subcategoryId) && 
                 !!currentProductId && 
                 isValidId(currentProductId),
        staleTime: 1000 * 60 * 10,
    });
};