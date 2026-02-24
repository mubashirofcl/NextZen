import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedProducts } from "../../api/user/products.api";

export const useRecommended = (subcategoryId, currentProductId) => {
    // 🟢 Regex to check if a string is a valid MongoDB ObjectId
    const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    return useQuery({
        queryKey: ["recommended", subcategoryId, currentProductId],
        queryFn: () => fetchRecommendedProducts(subcategoryId, currentProductId),
        // 🟢 ONLY enable if BOTH IDs are present and are valid ObjectIds
        enabled: !!subcategoryId && 
                 isValidId(subcategoryId) && 
                 !!currentProductId && 
                 isValidId(currentProductId),
        staleTime: 1000 * 60 * 10,
    });
};