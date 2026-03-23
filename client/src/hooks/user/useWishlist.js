import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";
import { nxToast } from "../../utils/userToast";
import TOAST_MESSAGES from "../../utils/toastMessages";

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
        mutationFn: async ({ productId, variantId, size }) => {
            const payload = {
                productId,
                variantId: variantId || null,
                size
            };
            const res = await userAxios.post("/user/wishlist/toggle", payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            refetch();
            if (data.action) {
                const isAdded = data.action === 'added';
                nxToast.success(
                    isAdded ? TOAST_MESSAGES.CART_WISHLIST.ADDED_TO_WISHLIST.title : TOAST_MESSAGES.CART_WISHLIST.REMOVED.title,
                    isAdded ? TOAST_MESSAGES.CART_WISHLIST.ADDED_TO_WISHLIST.message : TOAST_MESSAGES.CART_WISHLIST.REMOVED.message
                );
            }
        },
        onError: (err) => {
            const msg = err.response?.data?.message || TOAST_MESSAGES.SYSTEM.ACTION_FAILED.message;
            nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, msg);
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
            nxToast.security(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, err.response?.data?.message || TOAST_MESSAGES.SYSTEM.ACTION_FAILED.message);
        }
    });

    const clearWishlist = useMutation({
        mutationFn: () => userAxios.delete('/user/wishlist/clear'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            refetch();
            nxToast.success(TOAST_MESSAGES.CART_WISHLIST.PURGED.title, TOAST_MESSAGES.CART_WISHLIST.PURGED.message);
        },
        onError: (err) => {
            nxToast.error(TOAST_MESSAGES.SYSTEM.ACTION_FAILED.title, err.response?.data?.message || TOAST_MESSAGES.SYSTEM.ACTION_FAILED.message);
        }
    });

    const toggleWishlist = (productId, variantId = null, size = null) => {
        toggleMutation.mutate({ productId, variantId, size });
    };

    const isInWishlist = (productId, variantId = null, size = null) => {
        if (!wishlist || !productId) return false;
        return wishlist.some(item => {
            const itemPid = item.productId?._id || item.productId || item._id;
            const itemVid = item.variantId?._id || item.variantId || null;
            
            const pMatch = String(itemPid) === String(productId);
            const vMatch = variantId ? String(itemVid) === String(variantId) : true;
            const sMatch = size ? item.size === size : true;

            return pMatch && vMatch && sMatch;
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