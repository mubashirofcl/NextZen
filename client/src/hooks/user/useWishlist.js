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
        mutationFn: async (payload) => {
            const res = await userAxios.post("/user/wishlist/toggle", payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
        onError: (err) => {
            let msg = err.response?.data?.message || "Sync failed.";
            nxToast.error("Error", msg);
        }
    });

    const removeItem = useMutation({
        mutationFn: async (payload) => {

            const res = await userAxios.delete("/user/wishlist/remove", { data: payload });
            return res.data;
        },
        onSuccess: () => {
           
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
        },
        onError: (err) => {
            nxToast.error("Error", "Could not remove item.");
        }
    });

    // 4. Clear All
    const clearWishlist = useMutation({
        mutationFn: () => userAxios.delete('/user/wishlist/clear'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            nxToast.success("Archive Purged", "All items removed.");
        },
        onError: (err) => {
            nxToast.security("Action Blocked", err.response?.data?.message || "Purge failed.");
        }
    });

    return { wishlist, toggle, removeItem, clearWishlist, isLoading };
};