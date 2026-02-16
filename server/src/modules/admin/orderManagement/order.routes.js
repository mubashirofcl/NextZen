import express from 'express';
import {
    authorizeItemRefund,
    getAllOrders,
    getOrderDetail,
    updateAdminManifest
} from "./order.controller.js";

const router = express.Router();

router.get('/', getAllOrders);
router.get('/:id', getOrderDetail);
router.patch('/status/:orderId', updateAdminManifest);
router.patch('/:orderId/items/:itemId/authorize-refund', authorizeItemRefund);

export default router;