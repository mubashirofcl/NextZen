import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userAxios from "../../api/user/userAxios";
import { nxToast } from "../../utils/userToast";
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

    const addItem = useMutation({
        mutationFn: async (payload) => {
            const res = await userAxios.post("/user/cart/add", payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            nxToast.success("Success", "Archive entry created.");
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
            nxToast.security("Limit Reached", error.response?.data?.message || "Inventory conflict.");
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
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            nxToast.success("Inventory Updated", "Item removed from archive.");
        }
    });

    // --- STOCK VALIDATION PROTOCOL ---
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
            nxToast.security("Inventory Conflict", "One or more items are now out of stock.");
        }
    });

    return {
        cart,
        addItem,
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
            nxToast.success("Cart Cleared", "All items removed from your cart.");
        }
    });
};