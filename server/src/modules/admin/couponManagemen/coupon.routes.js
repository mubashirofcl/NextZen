import express from 'express';
import * as couponController from './coupon.controller.js';
import userAuth from '../../../middlewares/userAuth.middleware.js'; 

const router = express.Router();

router.get('/available', userAuth, couponController.getActiveCoupons);
router.post('/validate', userAuth, couponController.validateUserCoupon);

router.get('/', couponController.getAllCoupons);
router.post('/', couponController.createCoupon);
router.get('/:id', couponController.getCouponById);
router.delete('/:id', couponController.deleteCoupon);
router.patch('/:id', couponController.updateCoupon);
router.patch('/:id/toggle-status', couponController.toggleCouponStatus);

export default router;