import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { placeCodOrderApi } from "../../api/user/order.api";
import { nxToast } from "../../utils/userToast";
import userAxios from "../../api/user/userAxios";

export const useOrder = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const placeOrder = useMutation({
        mutationFn: placeCodOrderApi,
        onSuccess: (data) => {
            queryClient.invalidateQueries(["cart"]);
            nxToast.success("Success", "Order placed successfully.");
            navigate(`/checkout/success/${data.orderId}`);
        },
        onError: (error) => {
            nxToast.security("Deployment Failed", error.response?.data?.message || "Internal Error");
        }
    });

    return { placeOrder };
};

export const useOrders = () => {
    return useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            const { data } = await userAxios.get("/users/orders");
            return data.orders;
        },
        staleTime: 5000,
    });
};

export const useOrderDetail = (orderId) => {
    return useQuery({
        queryKey: ["order", orderId],
        queryFn: async () => {
            const { data } = await userAxios.get(`/users/orders/${orderId}`);
            return data.order;
        },
        enabled: !!orderId,
    });
};

// --- INDIVIDUAL ITEM ACTIONS ---

export const useCancelItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, itemId, reason }) => {
            // Matches backend: router.patch('/:orderId/items/:itemId/cancel')
            const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/cancel`, { reason });
            return data;
        },
        onSuccess: (_, variables) => {
            // Re-sync specific order and history list
            queryClient.invalidateQueries(["order", variables.orderId]);
            queryClient.invalidateQueries(["orders"]);
            nxToast.success("Order Updated", "Item cancelled and stock restored.");
        },
        onError: (err) => {
            nxToast.security("Cancel Failed", err.response?.data?.message || "Protocol error.");
        }
    });
};

export const useCancelFullOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, reason }) => {
            const { data } = await userAxios.patch(`/users/orders/${orderId}/cancel-all`, { reason });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["order", variables.orderId]);
            queryClient.invalidateQueries(["orders"]);
            nxToast.success("Manifest Voided", "The entire order has been cancelled.");
        },
        onError: (err) => nxToast.error("Protocol Error", err.response?.data?.message || "Failed to cancel order.")
    });
};

export const useReturnItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, itemId, reason }) => {
   
            const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/return`, { reason });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["order", variables.orderId]);
            queryClient.invalidateQueries(["orders"]);
            nxToast.success("Return Requested", "Manifest update pending verification.");
        },
        onError: (err) => {
            nxToast.security("Request Failed", err.response?.data?.message || "Mandatory reason missing.");
        }
    });
};

