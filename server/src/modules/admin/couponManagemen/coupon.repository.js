import Coupon from './coupon.model.js';

/**
 * Persist a new coupon to the database
 */
export const saveCoupon = async (data) => {
    return await Coupon.create(data);
};

/**
 * Retrieve all coupons sorted by newest first
 */
export const findAll = async () => {
    return await Coupon.find().sort({ createdAt: -1 });
};

/**
 * Find a specific coupon by its ID
 */
export const findById = async (id) => {
    return await Coupon.findById(id);
};

/**
 * Find a coupon by its unique code (case-insensitive check handled by model)
 */
export const findByCode = async (code) => {
    return await Coupon.findOne({ code: code.toUpperCase() });
};


export const updateById = async (id, data) => {
    return await Coupon.findByIdAndUpdate(
        id,
        { $set: data },
        {
            new: true,
            runValidators: true
        }
    );
};


/**
 * Permanently remove a coupon from the vault
 */
export const removeById = async (id) => {
    return await Coupon.findByIdAndDelete(id);
};

/**
 * Increment the usage counter when an order is placed
 */
export const incrementUsage = async (id) => {
    return await Coupon.findByIdAndUpdate(
        id,
        { $inc: { usedCount: 1 } },
        { new: true }
    );
};


export const findActiveCoupons = async () => {
    const now = new Date();
    return await Coupon.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $expr: { $lt: ["$usedCount", "$usageLimit"] } 
    }).sort({ createdAt: -1 });
};