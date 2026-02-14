import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { placeCodOrderApi } from "../../api/user/order.api";
import { nxToast } from "../../utils/userToast";
import userAxios from "../../api/baseAxios";

// 1. Hook for placing/creating orders
export const useOrder = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const placeOrder = useMutation({
        mutationFn: placeCodOrderApi,
        onSuccess: (data, variables) => {
            // Force clear cart and order cache to refresh UI
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });

            if (variables.status === 'payment_failed') {
                // Navigate to failure page with state
                navigate("/payment-failed", {
                    state: {
                        error: "Transaction not authorized.",
                        razorpayOrderId: variables.razorpayOrderId,
                        orderPayload: { ...variables, _id: data.orderId },
                        totalAmount: variables.totals?.totalAmount
                    },
                    replace: true
                });
            } else {
                nxToast.success("Success", "Manifest deployed.");
                navigate(`/checkout/success/${data.orderId}`, { replace: true });
            }
        },
        onError: (error) => {
            nxToast.security("Protocol Breach", error.response?.data?.message || "Sync Error");
        }
    });

    return { placeOrder };
};

// 2. Hook for fetching all orders (The missing export)
export const useOrders = () => {
    return useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            const { data } = await userAxios.get("/users/orders");
            return data.orders || [];
        },
        staleTime: 5000,
        refetchOnWindowFocus: true,
    });
};

// 3. Hook for fetching a single order detail
export const useOrderDetail = (orderId) => {
    return useQuery({
        queryKey: ["order", orderId],
        queryFn: async () => {
            const { data } = await userAxios.get(`/users/orders/${orderId}`);
            return data.order;
        },
        enabled: !!orderId,
        refetchInterval: 5000, // Sync status every 5 seconds
    });
};

// 4. Hook for cancelling a specific item
export const useCancelItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, itemId, reason }) => {
            const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/cancel`, { reason });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            nxToast.success("Item Cancelled", "Stock restored to inventory.");
        },
        onError: (err) => {
            nxToast.error("Cancel Failed", err.response?.data?.message || "Action blocked.");
        }
    });
};

// 5. Hook for returning a specific item
export const useReturnItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, itemId, reason }) => {
            const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/return`, { reason });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            nxToast.success("Return Requested", "Manifest updated.");
        }
    });
};

// 6. Hook for cancelling the entire order
export const useCancelFullOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, reason }) => {
            const { data } = await userAxios.patch(`/users/orders/${orderId}/cancel-all`, { reason });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            nxToast.success("Order Voided", "All items cancelled.");
        }
    });
};