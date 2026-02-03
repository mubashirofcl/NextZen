import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";
import { nxToast } from "../../utils/userToast";
import { clearCartApi } from "../../api/user/cart.api";

export const useCart = () => {
    const queryClient = useQueryClient();

    const { data: cart = { items: [] }, isLoading } = useQuery({
        queryKey: ["cart"],
        queryFn: async () => {
            const res = await userAxios.get("/user/cart");
            return res.data;
        }
    });

    const addItem = useMutation({
        mutationFn: async (payload) => {
            const res = await userAxios.post("/user/cart/add", payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            nxToast.success("Success", "Archive entry created.");
        },
        onError: (error) => {
            const errMsg = error.response?.data?.message || "Failed to add item.";
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
            nxToast.security("Limit Reached", error.response?.data?.message || "Cannot update quantity.");
        }
    });

    const remove = useMutation({
        mutationFn: async (itemId) => {
            const res = await userAxios.delete(`/user/cart/remove/${itemId}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });

            queryClient.invalidateQueries({ queryKey: ["wishlist"] });

            nxToast.success("Inventory Updated", "Item moved to your wishlist.");
        },
        onError: (error) => {
            nxToast.security("Purge Failed", error.response?.data?.message || "Internal system error.");
        }
    });

    return {
        cart,
        addItem,
        updateQty,
        remove,
        isLoading
    };
};

export const useClearCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clearCartApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            nxToast.success("Cart Cleared", "All items removed from your cart.");
        },
        onError: (error) => {
            nxToast.security(
                "Clear Failed",
                error.response?.data?.message || "Unable to clear cart."
            );
        }
    });
};