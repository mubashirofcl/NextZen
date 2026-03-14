import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWalletApi, addMoneyToWalletApi } from "../../api/user/wallet.api";
import { nxToast } from "../../utils/userToast";

export const useWallet = () => {
    return useQuery({
        queryKey: ["wallet"],
        queryFn: fetchWalletApi,
        select: (data) => data.wallet,
        staleTime: 1000 * 60,
        refetchOnWindowFocus: true,
        retry: 2
    });
};

export const useAddMoney = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addMoneyToWalletApi,
        onSuccess: (data) => {
            queryClient.setQueryData(["wallet"], (oldData) => {
                return {
                    ...oldData,
                    wallet: data.wallet 
                };
            });

            queryClient.invalidateQueries({ queryKey: ["wallet"] }); 

            const lastTx = data.wallet?.transactions?.slice(-1)[0];
            const amount = lastTx?.amount || 0;
            
            nxToast.success("Funds Added", `₹${amount} credited to your wallet!`);
        },
        onError: (error) => {
            nxToast.error("Transaction Failed", error.response?.data?.message || "Could not verify payment.");
        }
    });
};