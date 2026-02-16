import { useQuery } from "@tanstack/react-query";
import { fetchWalletApi } from "../../api/user/wallet.api";

export const useWallet = () => {
    return useQuery({
        queryKey: ["wallet"],
        queryFn: fetchWalletApi,
        select: (data) => data.wallet,
        staleTime: 1000 * 5,
        refetchOnWindowFocus: true,
        retry: 2
    });
};