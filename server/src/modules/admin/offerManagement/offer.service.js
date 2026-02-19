import * as offerRepo from "./offer.repository.js";

export const deployOffer = async (data) => {
    // 1. Date Validation
    if (new Date(data.endDate) <= new Date(data.startDate)) {
        throw new Error("Expiry date must be after the launch date.");
    }

    // 2. Uniqueness Logic: Check if name exists within the same Type (ApplyFor)
    // We trim to prevent "Sale " and "Sale" being treated as different
    const cleanTitle = data.title.trim();
    const existing = await offerRepo.findOneByNameAndType(cleanTitle, data.applyFor);

    if (existing) {
        throw new Error(`An offer with the name "${cleanTitle}" already exists for ${data.applyFor.toLowerCase()} level.`);
    }

    return await offerRepo.create({ ...data, title: cleanTitle });
};

export const updateOffer = async (id, data) => {
    // 1. Date Validation (if dates are being updated)
    if (data.startDate && data.endDate) {
        if (new Date(data.endDate) <= new Date(data.startDate)) {
            throw new Error("Expiry date must be after the launch date.");
        }
    }

    // 2. Uniqueness Logic for Updates
    if (data.title || data.applyFor) {
        const currentOffer = await offerRepo.findById(id);
        const titleToCheck = data.title?.trim() || currentOffer.title;
        const typeToCheck = data.applyFor || currentOffer.applyFor;

        const duplicate = await offerRepo.findOneByNameAndType(titleToCheck, typeToCheck);

        // If a duplicate exists and it's not the record we are currently editing
        if (duplicate && duplicate._id.toString() !== id) {
            throw new Error(`The title "${titleToCheck}" is already in use for ${typeToCheck.toLowerCase()}s.`);
        }
    }

    return await offerRepo.update(id, data);
};

export const getAllOffers = async () => await offerRepo.findAll();
export const getOfferById = async (id) => await offerRepo.findById(id);
export const deleteOffer = async (id) => await offerRepo.remove(id);
export const getAvailableRules = async (type) => await offerRepo.findByType(type);