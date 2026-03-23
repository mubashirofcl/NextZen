import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";
import { nxToast } from "../../utils/userToast";
import TOAST_MESSAGES from "../../utils/toastMessages";
import { clearCartApi } from "../../api/user/cart.api";

export const useCart = () => {
    const queryClient = useQueryClient();

    const { data: cart = { items: [] }, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["cart"],
        queryFn: async () => {
            const res = await userAxios.get("/user/cart");
            return res.data;
        },
        refetchOnWindowFocus: true,
        staleTime: 0,
        refetchInterval: 30000,
    });

    const addToCart = useMutation({
        mutationFn: async (payload) => {
            const res = await userAxios.post("/user/cart/add", payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            nxToast.success(TOAST_MESSAGES.CART_WISHLIST.ADDED_TO_CART.title, TOAST_MESSAGES.CART_WISHLIST.ADDED_TO_CART.message);
        },
        onError: (error) => {
            const serverMessage = error.response?.data?.message || "Item was not added to your bag.";
            nxToast.error("Request Blocked", serverMessage);
        }
    });

    const updateQty = useMutation({
        mutationFn: async ({ itemId, action }) => {
            const res = await userAxios.patch(`/user/cart/update/${itemId}`, { action });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        },
        onError: (error) => {

            const serverMessage = error.response?.data?.message || "Operation failed";

            console.log("Triggering Toast with message:", serverMessage);

            nxToast.error("Inventory Update", serverMessage);

            queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
    });

    const remove = useMutation({
        mutationFn: async (itemId) => {
            const res = await userAxios.delete(`/user/cart/remove/${itemId}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            nxToast.success(TOAST_MESSAGES.CART_WISHLIST.REMOVED.title, TOAST_MESSAGES.CART_WISHLIST.REMOVED.message);
        }
    });

    const validateStock = useMutation({
        mutationFn: async () => {
            const res = await userAxios.get("/user/cart/validate-checkout");
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        },
        onError: (error) => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            nxToast.security(TOAST_MESSAGES.PRODUCT.OUT_OF_STOCK.title, TOAST_MESSAGES.PRODUCT.OUT_OF_STOCK.message);
        }
    });

    return {
        cart,
        addToCart,
        updateQty,
        remove,
        validateStock,
        isLoading,
        isFetching,
        refetch
    };
};

export const useClearCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clearCartApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            nxToast.success(TOAST_MESSAGES.CART_WISHLIST.PURGED.title, TOAST_MESSAGES.CART_WISHLIST.PURGED.message);
        }
    });
};