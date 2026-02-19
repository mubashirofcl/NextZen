import * as couponRepo from './coupon.repository.js';
import Order from '../../user/order/order.model.js'; 

// Basic Repo Wrappers
export const saveCoupon = async (data) => { return await couponRepo.saveCoupon(data); };
export const findAll = async () => { return await couponRepo.findAll(); };
export const findById = async (id) => { return await couponRepo.findById(id); };
export const findByCode = async (code) => { return await couponRepo.findByCode(code); };
export const updateById = async (id, data) => { return await couponRepo.updateById(id, { $set: data }, { new: true, runValidators: true }); };
export const removeById = async (id) => { return await couponRepo.removeById(id); };
export const incrementUsage = async (id) => { return await couponRepo.incrementUsage(id); };
export const findActiveCoupons = async () => { return await couponRepo.findActiveCoupons(); };

// 🟢 ADMIN SPECIFIC LOGIC
export const createCoupon = async (couponData) => {
    const existingCoupon = await couponRepo.findByCode(couponData.code);
    if (existingCoupon) throw new Error("Coupon code already exists.");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(couponData.endDate) < today) throw new Error("Expiry date cannot be in the past.");
    
    return await couponRepo.saveCoupon({ ...couponData, code: couponData.code.toUpperCase() });
};

export const listAllCoupons = async () => { return await couponRepo.findAll(); };
export const getCouponById = async (id) => { return await couponRepo.findById(id); };
export const updateExistingCoupon = async (id, updateData) => { return await couponRepo.updateById(id, updateData); };
export const purgeCoupon = async (id) => { return await couponRepo.removeById(id); };

// 🟢 USER SPECIFIC LOGIC (Validation limits)
export const validateCouponForUser = async (code, subtotal, userId) => {
    const coupon = await couponRepo.findByCode(code);

    if (!coupon || !coupon.isActive) {
        throw new Error("Invalid or inactive coupon code.");
    }

    const now = new Date();
    if (now < coupon.startDate) throw new Error("This coupon is not active yet.");
    if (now > coupon.endDate) throw new Error("This coupon has expired.");

    if (subtotal < coupon.minPurchaseAmt) {
        throw new Error(`Minimum purchase of ₹${coupon.minPurchaseAmt} required.`);
    }

    // Validation 1: Store-wide Limit
    if (coupon.usedCount >= coupon.usageLimit) {
        throw new Error("This coupon's overall store usage limit has been reached.");
    }

    // Validation 2: Individual User Limit
    if (userId) {
        const userUsageCount = await Order.countDocuments({
            userId: userId,
            couponCode: coupon.code,
            status: { $nin: ['payment_failed', 'cancelled', 'returned'] } 
        });

        if (userUsageCount >= coupon.usagePerUser) {
            throw new Error(`You have reached the maximum allowed uses (${coupon.usagePerUser}) for this coupon.`);
        }
    }

    return coupon;
};