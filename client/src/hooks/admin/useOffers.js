import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getOffersApi,
    createOfferApi,
    updateOfferApi,
    deleteOfferApi,
    getOfferByIdApi,
    toggleOfferStatusApi
} from "../../api/admin/offer.api";
import { adminToast } from "../../utils/adminToast";
import { useNavigate } from "react-router-dom";
import { nxToast } from "../../utils/userToast";

export const useOffers = (id = null) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Fetch All Offers
    const { data: offersData, isLoading } = useQuery({
        queryKey: ["admin-offers"],
        queryFn: getOffersApi,
        enabled: !id
    });

    // Fetch Single Offer for Editing
    const { data: detailData, isLoading: isLoadingDetail } = useQuery({
        queryKey: ["admin-offer", id],
        queryFn: () => getOfferByIdApi(id),
        enabled: !!id
    });

    const createMutation = useMutation({
        mutationFn: createOfferApi,
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-offers"]);
            adminToast.success("Offer Rule Forged Successfully");
            navigate("/admin/offers");
        },
        onError: (err) => adminToast.error(err.response?.data?.message || "Forge failed")
    });

    const updateMutation = useMutation({
        mutationFn: updateOfferApi,
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-offers"]);
            adminToast.success("Offer Rule Updated");
            navigate("/admin/offers");
        },
        onError: (err) => adminToast.error(err.response?.data?.message || "Update failed")
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOfferApi,
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-offers"]);
            adminToast.success("Offer Purged from Vault");
        }
    });

    return {
        // DATA - Fixed mapping
        offers: offersData?.offers || [],
        offerDetail: detailData?.offer,

        // STATUS
        isLoading,
        isLoadingDetail,
        isPending: createMutation.isPending || updateMutation.isPending,

        // ACTIONS
        createOffer: createMutation.mutateAsync,
        updateOffer: updateMutation.mutateAsync,
        deleteOffer: deleteMutation.mutateAsync
    };
};

export const useToggleOffer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleOfferStatusApi,
        onMutate: async (offerId) => {
            await queryClient.cancelQueries({ queryKey: ["admin-offers"] });
            const previousOffers = queryClient.getQueryData(["admin-offers"]);

            queryClient.setQueryData(["admin-offers"], (old) => {
                if (!old || !old.offers) return old;
                return {
                    ...old,
                    offers: old.offers.map((offer) =>
                        offer._id === offerId ? { ...offer, isActive: !offer.isActive } : offer
                    ),
                };
            });
            return { previousOffers };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(["admin-offers"], context.previousOffers);
            nxToast.security("Update Failed", err.response?.data?.message || "Error toggling offer");
        },
        onSuccess: (data) => nxToast.success(data.message),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-offers"] }),
    });
};