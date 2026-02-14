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
            nxToast.success("Success", "Manifest deployed successfully.");
            navigate(`/checkout/success/${data.orderId}`);
        },
        onError: (error) => {
            nxToast.security("Deployment Failed", error.response?.data?.message || "Internal Protocol Error");
        }
    });

    return { placeOrder };
};

export const useOrders = () => {
    return useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            const { data } = await userAxios.get("/users/orders");
            return data.orders || []; 
        },
        staleTime: 5000, 
        refetchInterval: 10000, 
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
        refetchInterval: 4000,
        refetchIntervalInBackground: true,
    });
};

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
            nxToast.success("Asset Voided", "Item cancelled and stock restored to warehouse.");
        },
        onError: (err) => {
            nxToast.security("Cancel Failed", err.response?.data?.message || "Logistics state blocks cancellation.");
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
            queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            nxToast.success("Manifest Terminated", "All items voided successfully.");
        },
        onError: (err) => nxToast.error("Protocol Error", err.response?.data?.message || "Failed to terminate manifest.")
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
            nxToast.success("Return Requested", "Verification protocol initiated.");
        },
        onError: (err) => {
            nxToast.security("Request Failed", err.response?.data?.message || "Reason is mandatory for return.");
        }
    });
};