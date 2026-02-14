import express from "express";
import {
    placeOrder,
    getOrderById,
    getUserOrders,
    cancelOrderItem,
    returnOrderItem,
    cancelFullOrder,
    completeRetry
} from "./order.controller.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();

router.post("/place-cod", userAuth, placeOrder);
router.get("/", userAuth, getUserOrders);
router.get("/:orderId", userAuth, getOrderById);
router.patch('/:orderId/items/:itemId/cancel', userAuth, cancelOrderItem);
router.patch('/:orderId/items/:itemId/return', userAuth, returnOrderItem);
router.patch("/:orderId/complete-retry", userAuth, completeRetry);

router.patch('/:orderId/cancel-all', userAuth, cancelFullOrder);


export default router;