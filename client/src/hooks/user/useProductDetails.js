import { useQuery } from "@tanstack/react-query";
import userAxios from "../../api/baseAxios";

export const useProductDetails = (id) => {
    return useQuery({
        queryKey: ["product", id],
        queryFn: async () => {
            const { data } = await userAxios.get(`/products/${id}`);
            return data.product;
        },
        enabled: !!id,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });
};