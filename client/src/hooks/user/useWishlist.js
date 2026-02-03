import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";
import { nxToast } from "../../utils/userToast";

export const useWishlist = () => {
    const queryClient = useQueryClient();
    const { data: wishlist = [], isLoading } = useQuery({
        queryKey: ["wishlist"],
        queryFn: async () => {
            const res = await userAxios.get("/user/wishlist");
            return res.data.products || [];
        }
    });

    const toggle = useMutation({
        mutationFn: async (payload) => userAxios.post("/user/wishlist/toggle", payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["wishlist"]);
        },
        onError: (err) => {
            let Err = err.response?.data?.message || "Sync failed.";
        }
    });

    const clearWishlist = useMutation({
        mutationFn: () => userAxios.delete('/user/wishlist/clear'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            nxToast.success("Archive Purged", "All items have been removed from your vault.");
        },
        onError: (err) => {
            nxToast.security("Action Blocked", err.response?.data?.message || "Purge failed.");
        }
    });

    return { wishlist, toggle, clearWishlist, isLoading };
};