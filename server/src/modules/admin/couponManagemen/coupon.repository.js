import Coupon from './coupon.model.js';


export const saveCoupon = async (data) => {
    return await Coupon.create(data);
};

export const findAll = async () => {
    return await Coupon.find().sort({ createdAt: -1 });
};

export const findById = async (id) => {
    return await Coupon.findById(id);
};

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



export const removeById = async (id) => {
    return await Coupon.findByIdAndDelete(id);
};

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