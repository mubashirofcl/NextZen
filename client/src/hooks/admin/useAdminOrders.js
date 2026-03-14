import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAdminOrders,
    updateOrderStatus,
    getAdminOrderDetails,
    handleReturnAction
} from "../../api/admin/order.api";
import { adminToast } from "../../utils/adminToast";



export const useAdminOrders = (filters) => {
    return useQuery({
        queryKey: ['admin-orders', filters],
        queryFn: () => getAdminOrders(filters),
        placeholderData: (previousData) => previousData,
        retry: 1,
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    });
};


export const useAdminOrderDetails = (orderId) => {
    return useQuery({
        queryKey: ['admin-order-details', orderId],
        queryFn: () => getAdminOrderDetails(orderId),
        enabled: !!orderId,
        refetchInterval: 4000,
        refetchIntervalInBackground: true,
    });
};


export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateOrderStatus,
        onSuccess: () => {

            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-order-details'] });
            adminToast.success("Manifest Synchronized");
        },
        onError: (err) => {
            adminToast.warn(err.response?.data?.message || "Sync Failed");
        }
    });
};

export const useHandleReturn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: handleReturnAction,
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['admin-order-details'] });
            adminToast.success(res.message || "Return Protocol Executed");
        },
        onError: (err) => {
            adminToast.warn(err.response?.data?.message || "Return Action Failed");
        }
    });
};