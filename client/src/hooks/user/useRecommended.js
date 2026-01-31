import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedProducts } from "../../api/user/products.api";

export const useRecommended = (subcategoryId, currentProductId) => {
    return useQuery({
        queryKey: ["recommended", subcategoryId, currentProductId],
        queryFn: () => fetchRecommendedProducts(subcategoryId, currentProductId),
        enabled: !!subcategoryId && !!currentProductId,
        staleTime: 1000 * 60 * 10,
    });
};