import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";
import { nxToast } from "../../utils/userToast";

export const useWishlist = () => {
    const queryClient = useQueryClient();

    const { data: wishlist = [], isLoading, refetch } = useQuery({
        queryKey: ["wishlist"],
        queryFn: async () => {
            const res = await userAxios.get("/user/wishlist");
            return res.data.products || [];
        },
        staleTime: 0,
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ productId, variantId }) => {
            const payload = {
                productId,
                variantId: variantId || null
            };
            const res = await userAxios.post("/user/wishlist/toggle", payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            refetch();
            if (data.action) {
                const msg = data.action === 'added' ? "Added to Archive" : "Removed from Archive";
                nxToast.success("Success", msg);
            }
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Sync failed.";
            nxToast.security("Archive Error", msg);
        }
    });

    const removeItem = useMutation({
        mutationFn: async (payload) => {
            const res = await userAxios.delete("/user/wishlist/remove", { data: payload });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            refetch();
        },
        onError: (err) => {
            nxToast.security("Error", err.response?.data?.message || "Could not remove item.");
        }
    });

    const clearWishlist = useMutation({
        mutationFn: () => userAxios.delete('/user/wishlist/clear'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            refetch();
            nxToast.success("Archive Purged", "All items removed.");
        },
        onError: (err) => {
            nxToast.error("Action Blocked", err.response?.data?.message || "Purge failed.");
        }
    });

    const toggleWishlist = (productId, variantId = null) => {
        toggleMutation.mutate({ productId, variantId });
    };

    const isInWishlist = (productId) => {
        if (!wishlist || !productId) return false;
        return wishlist.some(item => {
            const itemPid = item.productId?._id || item.productId || item._id;
            return String(itemPid) === String(productId);
        });
    };

    return {
        wishlist,
        toggleWishlist,
        isInWishlist,
        removeItem,
        clearWishlist,
        isLoading,
        isPending: toggleMutation.isPending
    };
};