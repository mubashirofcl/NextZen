import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWalletApi, addMoneyToWalletApi } from "../../api/user/wallet.api";
import { nxToast } from "../../utils/userToast";

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

export const useAddMoney = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addMoneyToWalletApi,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["wallet"] }); 
            nxToast.success("Funds Added", `₹${data.wallet?.transactions[data.wallet.transactions.length - 1].amount} credited to your wallet!`);
        },
        onError: (error) => {
            nxToast.error("Transaction Failed", error.response?.data?.message || "Could not verify payment.");
        }
    });
};