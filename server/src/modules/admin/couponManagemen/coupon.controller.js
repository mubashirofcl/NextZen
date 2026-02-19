import * as couponService from './coupon.service.js';
import Coupon from './coupon.model.js';

// 🟢 ADMIN: Get all coupons for listing
export const getAllCoupons = async (req, res, next) => {
    try {
        const coupons = await couponService.listAllCoupons();
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        next(error);
    }
};

// 🟢 ADMIN: Create new coupon
export const createCoupon = async (req, res, next) => {
    try {
        const coupon = await couponService.createCoupon(req.body);
        res.status(201).json({
            success: true,
            message: "Coupon successfully deployed.",
            coupon
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 🟢 ADMIN: Get single coupon for editing
export const getCouponById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await couponService.getCouponById(id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Promotion not found in vault" });
        }

        res.status(200).json({ success: true, coupon });
    } catch (error) {
        next(error);
    }
};

// 🟢 ADMIN: Update coupon
export const updateCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedCoupon = await couponService.updateExistingCoupon(id, req.body);

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Target coupon not found for update" });
        }

        res.status(200).json({
            success: true,
            message: "Promotion parameters updated",
            coupon: updatedCoupon
        });
    } catch (error) {
        next(error);
    }
};

// 🟢 ADMIN: Delete coupon
export const deleteCoupon = async (req, res, next) => {
    try {
        await couponService.purgeCoupon(req.params.id);
        res.status(200).json({ success: true, message: "Coupon purged from vault." });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// 🟢 USER: Validate applied coupon during checkout
export const validateUserCoupon = async (req, res, next) => {
    try {
        const { code, subtotal } = req.body;
        const userId = req.user?.userId; // Required for 'Uses Per Customer' check

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User identification missing." });
        }

        const coupon = await couponService.validateCouponForUser(code, subtotal, userId);

        res.status(200).json({ 
            success: true, 
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount,
                minPurchaseAmt: coupon.minPurchaseAmt
            } 
        });
    } catch (error) { 
        res.status(400).json({ success: false, message: error.message }); 
    }
};

// 🟢 USER: Fetch list of available active coupons
export const getActiveCoupons = async (req, res, next) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }
        }).select('code discountType discountValue description minPurchaseAmt maxDiscount');
        
        res.status(200).json({ success: true, coupons });
    } catch (error) { 
        next(error); 
    }
};