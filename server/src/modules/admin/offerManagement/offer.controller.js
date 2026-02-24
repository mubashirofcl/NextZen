import * as offerService from "./offer.service.js";

export const createOffer = async (req, res, next) => {
    try {
        const offer = await offerService.deployOffer(req.body);
        res.status(201).json({ success: true, message: "Offer rule deployed", offer });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

export const getOffers = async (req, res, next) => {
    try {
        const offers = await offerService.getAllOffers();
        res.status(200).json({ success: true, offers });
    } catch (error) { next(error); }
};

export const getOfferById = async (req, res, next) => {
    try {
        const offer = await offerService.getOfferById(req.params.id);
        res.status(200).json({ success: true, offer });
    } catch (error) { next(error); }
};

export const updateOffer = async (req, res, next) => {
    try {
        const offer = await offerService.updateOffer(req.params.id, req.body);
        res.status(200).json({ success: true, message: "Rule updated", offer });
    } catch (error) { next(error); }
};

export const deleteOffer = async (req, res, next) => {
    try {
        await offerService.deleteOffer(req.params.id);
        res.status(200).json({ success: true, message: "Offer purged" });
    } catch (error) {
        next(error);
    }
};

// This endpoint will be used by Product/Category forms to fetch "Pull" options
export const getAvailableRules = async (req, res, next) => {
    try {
        const { type } = req.query; // ?type=PRODUCT or ?type=CATEGORY
        const offers = await offerService.getAvailableRules(type);
        res.status(200).json({ success: true, offers });
    } catch (error) { next(error); }
};

export const toggleOfferStatus = async (req, res, next) => {
    try {
        const updatedOffer = await offerService.toggleOfferStatus(req.params.id);
        res.status(200).json({
            success: true,
            message: `Offer ${updatedOffer.isActive ? 'Activated' : 'Blocked'} successfully.`,
            offer: updatedOffer
        });
    } catch (error) {
        next(error);
    }
};