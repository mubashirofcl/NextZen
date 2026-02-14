import { useQuery } from "@tanstack/react-query";
import { fetchAddresses } from "../../api/user/address.api";

export const useAddress = () => {
    return useQuery({
        queryKey: ["addresses"],
        queryFn: async () => {
            const response = await fetchAddresses();
            
            return response.data; 
        },
    });
};