import express from "express";
import {
    placeOrder,
    getOrderById,
    getUserOrders,
    cancelOrderItem,
    returnOrderItem,
    cancelFullOrder,
    completeRetry, // 🟢 Matches completeRetryPaymentApi call
    finalizeReturnRefund
} from "./order.controller.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();

// Base Path is /api/users/orders
router.post("/place-cod", userAuth, placeOrder);
router.get("/", userAuth, getUserOrders);
router.get("/:orderId", userAuth, getOrderById);

// Item specific actions
router.patch('/:orderId/items/:itemId/cancel', userAuth, cancelOrderItem);
router.patch('/:orderId/items/:itemId/return', userAuth, returnOrderItem);
router.patch('/:orderId/items/:itemId/finalize-return', userAuth, finalizeReturnRefund);

// 🟢 RETRY ENDPOINT
// This receives the payment info from Razorpay after a failure retry
router.patch("/:orderId/complete-retry", userAuth, completeRetry);

// Full order actions
router.patch('/:orderId/cancel-all', userAuth, cancelFullOrder);

export default router;