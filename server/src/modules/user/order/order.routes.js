import express from "express";
import { 
    placeOrderCOD, 
    getOrderById, 
    getUserOrders, 
    cancelOrderItem, 
    cancelFullOrder,
    returnOrderItem 
} from "./order.controller.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();


router.post("/place-cod", userAuth, placeOrderCOD);
router.get("/", userAuth, getUserOrders);
router.get("/:orderId", userAuth, getOrderById);

router.patch('/:orderId/items/:itemId/cancel', userAuth, cancelOrderItem);

router.patch('/:orderId/cancel-all', userAuth, cancelFullOrder);

router.patch('/:orderId/items/:itemId/return', userAuth, returnOrderItem);

export default router;