import express from 'express';
import {
    getAllOrders,
    getOrderDetail,
    updateAdminManifest
} from "./order.controller.js";

const router = express.Router();

router.get('/', getAllOrders);
router.get('/:id', getOrderDetail);
router.patch('/status/:orderId', updateAdminManifest);

export default router;