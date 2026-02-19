import Offer from "./offer.model.js";

export const create = async (data) => await Offer.create(data);

export const findAll = async () => await Offer.find().sort({ createdAt: -1 });

export const findById = async (id) => await Offer.findById(id);

export const update = async (id, data) => {
    return await Offer.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
};

export const remove = async (id) => await Offer.findByIdAndDelete(id);

export const findByType = async (type) => {
    return await Offer.find({
        applyFor: type.toUpperCase(),
        isActive: true,
        endDate: { $gte: new Date() },
        startDate: { $lte: new Date() }
    });
};

export const findOneByNameAndType = async (title, applyFor) => {
    // Uses case-insensitive regex to match "winter sale" vs "WINTER SALE"
    return await Offer.findOne({
        title: { $regex: new RegExp(`^${title}$`, "i") },
        applyFor: applyFor
    });
};