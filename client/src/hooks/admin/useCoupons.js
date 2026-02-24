import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getCouponsApi,
    createCouponApi,
    updateCouponApi,
    deleteCouponApi,
    getCouponByIdApi,
    toggleCouponStatusApi
} from "../../api/admin/coupon.api";
import { nxToast } from "../../utils/userToast";
import { useNavigate } from "react-router-dom";

export const useCoupons = (id = null) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Fetch All (Enabled only if no ID is provided)
    const { data: coupons, isLoading } = useQuery({
        queryKey: ["admin-coupons"],
        queryFn: getCouponsApi,
        enabled: !id
    });

    // Fetch Single (Enabled only if ID is provided)
    const { data: couponDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ["admin-coupon", id],
        queryFn: () => getCouponByIdApi(id),
        enabled: !!id
    });

    const createMutation = useMutation({
        mutationFn: createCouponApi,
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
            nxToast.success(res.message || "Coupon Deployed");
            navigate("/admin/coupons");
        },
        onError: (err) => nxToast.error(err.response?.data?.message || "Deployment failed")
    });

    const updateMutation = useMutation({
        mutationFn: updateCouponApi,
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
            queryClient.invalidateQueries({ queryKey: ["admin-coupon", id] }); // Refresh specific details
            nxToast.success(res.message || "Coupon Updated");
            navigate("/admin/coupons");
        },
        onError: (err) => nxToast.error(err.response?.data?.message || "Update failed")
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCouponApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
            nxToast.success("Coupon Purged");
        },
        onError: (err) => nxToast.error(err.response?.data?.message || "Purge failed")
    });

    return {
        // Data
        coupons: coupons?.coupons || [],
        couponDetail: couponDetail?.coupon, 

        // States
        isLoading,
        isLoadingDetail,
        isPending: createMutation.isPending || updateMutation.isPending,

        // Methods
        createCoupon: createMutation.mutateAsync,
        updateCoupon: updateMutation.mutateAsync,
        deleteCoupon: deleteMutation.mutateAsync,
    };
};

export const useToggleCoupon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleCouponStatusApi,

        onMutate: async (couponId) => {
            await queryClient.cancelQueries({ queryKey: ["admin-coupons"] });
            const previousCoupons = queryClient.getQueryData(["admin-coupons"]);

            queryClient.setQueryData(["admin-coupons"], (old) => {
                if (!old || !old.coupons) return old;
                return {
                    ...old,
                    coupons: old.coupons.map((coupon) =>
                        coupon._id === couponId
                            ? { ...coupon, isActive: !coupon.isActive }
                            : coupon
                    ),
                };
            });

            return { previousCoupons };
        },

        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["admin-coupons"], context.previousCoupons);
            nxToast.error("Update Failed", err.response?.data?.message || "Could not change status.");
        },

        onSuccess: (data) => {
            nxToast.success(data.message || "Status Updated");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
        }
    });
};