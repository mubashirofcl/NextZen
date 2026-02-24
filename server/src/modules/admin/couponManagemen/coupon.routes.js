import express from 'express';
import * as couponController from './coupon.controller.js';
import userAuth from '../../../middlewares/userAuth.middleware.js'; // Ensure correct path

const router = express.Router();

// 🟢 User Facing Routes (MUST have userAuth to track "Uses Per Customer")
router.get('/available', userAuth, couponController.getActiveCoupons);
router.post('/validate', userAuth, couponController.validateUserCoupon);

// Admin Facing Routes (Assuming these are protected by adminAuth higher up in app.js)
router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.get('/:id', couponController.getCouponById);
router.delete('/:id', couponController.deleteCoupon);
router.patch('/:id', couponController.updateCoupon);
router.patch('/:id/toggle-status', couponController.toggleCouponStatus);

export default router;