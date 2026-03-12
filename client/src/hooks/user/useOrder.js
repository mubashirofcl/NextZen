import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { placeCodOrderApi } from "../../api/user/order.api";
import { nxToast } from "../../utils/userToast";
import userAxios from "../../api/baseAxios";

export const useOrder = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const placeOrder = useMutation({
        mutationFn: placeCodOrderApi,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
        },
        onError: (error) => {
            nxToast.security("Protocol Breach", error.response?.data?.message || "Sync Error");
        }
    });

    return { placeOrder };
};

export const useOrders = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ["orders", page, limit],
        queryFn: async () => {
            const { data } = await userAxios.get(`/users/orders?page=${page}&limit=${limit}`);
            return data;
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
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
        refetchInterval: (query) => {
            const order = query.state.data;
            if (!order) return false;
            return order.paymentStatus === 'Pending' || order.orderStatus === 'Pending' ? 3000 : false;
        },
        refetchOnMount: "always",
    });
};

export const useRetryPayment = () => {
    return useMutation({
        mutationFn: async (orderId) => {
            const { data } = await userAxios.post("/user/payment/create-order", {
                orderId,
                isRetry: true
            });
            return data;
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Payment re-initialization failed";
            if (message.toLowerCase().includes("stock") || message.toLowerCase().includes("blocked")) {
                nxToast.security("Order Invalid", message);
            } else {
                nxToast.error("Retry Failed", message);
            }
        }
    });
};

export const useCompleteRetry = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async ({ orderId, paymentInfo, newRazorpayOrderId }) => {
            const { data } = await userAxios.patch(`/users/orders/${orderId}/complete-retry`, {
                paymentInfo,
                newRazorpayOrderId
            });
            return data;
        },
        onSuccess: async (data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] }),
                queryClient.invalidateQueries({ queryKey: ["orders"] }),
                queryClient.invalidateQueries({ queryKey: ["inventory"] }),
                queryClient.invalidateQueries({ queryKey: ["wallet"] })
            ]);

            if (data.warning) {
                nxToast.warn("Policy Update", data.warning);
            }
            
            nxToast.success("Success", "Order confirmed successfully.");
            navigate(`/checkout/success/${variables.orderId}`, { replace: true });
        },
        onError: (err) => {
            nxToast.error("Verification Error", err.response?.data?.message || "Sync Error");
        }
    });
};

export const useCancelItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, itemId, reason }) => {
            const { data } = await userAxios.patch(`/users/orders/${orderId}/items/${itemId}/cancel`, { reason });
            return data;
        },
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            nxToast.success("Item Cancelled", "Refund credited to wallet.");
        },
        onError: (err) => {
            nxToast.security("Cancel Failed", err.response?.data?.message || "Action blocked.");
        }
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
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            nxToast.success("Return Requested", "Manifest updated.");
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
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            nxToast.success("Order Voided", "All items cancelled and refunded.");
        }
    });
};