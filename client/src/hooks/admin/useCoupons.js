import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getCouponsApi,
    createCouponApi,
    updateCouponApi,
    deleteCouponApi,
    getCouponByIdApi
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
            queryClient.invalidateQueries(["admin-coupons"]);
            nxToast.success(res.message || "Coupon Deployed");
            navigate("/admin/coupons");
        },
        onError: (err) => nxToast.error(err.response?.data?.message || "Deployment failed")
    });

    const updateMutation = useMutation({
        mutationFn: updateCouponApi,
        onSuccess: (res) => {
            queryClient.invalidateQueries(["admin-coupons"]);
            queryClient.invalidateQueries(["admin-coupon", id]); // Refresh specific details
            nxToast.success(res.message || "Coupon Updated");
            navigate("/admin/coupons");
        },
        onError: (err) => nxToast.error(err.response?.data?.message || "Update failed")
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCouponApi,
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-coupons"]);
            nxToast.success("Coupon Purged");
        },
        onError: (err) => nxToast.error(err.response?.data?.message || "Purge failed")
    });

    return {
        // Data
        coupons: coupons?.coupons || [],
        couponDetail: couponDetail?.coupon, // Ensure backend returns { success: true, coupon: {...} }

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