import offerModel from "./offer.model.js";
import * as offerRepo from "./offer.repository.js";

export const deployOffer = async (data) => {

    if (new Date(data.endDate) <= new Date(data.startDate)) {
        throw new Error("Expiry date must be after the launch date.");
    }

    const cleanTitle = data.title.trim();
    const existing = await offerRepo.findOneByNameAndType(cleanTitle, data.applyFor);

    if (existing) {
        throw new Error(`An offer with the name "${cleanTitle}" already exists for ${data.applyFor.toLowerCase()} level.`);
    }

    return await offerRepo.create({ ...data, title: cleanTitle });
};

export const updateOffer = async (id, data) => {
    if (data.startDate && data.endDate) {
        if (new Date(data.endDate) <= new Date(data.startDate)) {
            throw new Error("Expiry date must be after the launch date.");
        }
    }

    if (data.title || data.applyFor) {
        const currentOffer = await offerRepo.findById(id);
        const titleToCheck = data.title?.trim() || currentOffer.title;
        const typeToCheck = data.applyFor || currentOffer.applyFor;

        const duplicate = await offerRepo.findOneByNameAndType(titleToCheck, typeToCheck);

        if (duplicate && duplicate._id.toString() !== id) {
            throw new Error(`The title "${titleToCheck}" is already in use for ${typeToCheck.toLowerCase()}s.`);
        }
    }

    return await offerRepo.update(id, data);
};


export const toggleOfferStatus = async (id) => {
    const offer = await offerModel.findById(id); 
    if (!offer) throw new Error("Offer logic not found in vault.");
    
    offer.isActive = !offer.isActive;
    return await offer.save();
};


export const getAllOffers = async () => await offerRepo.findAll();
export const getOfferById = async (id) => await offerRepo.findById(id);
export const deleteOffer = async (id) => await offerRepo.remove(id);
export const getAvailableRules = async (type) => await offerRepo.findByType(type);