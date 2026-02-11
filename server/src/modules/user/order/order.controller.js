import variantModel from "../../admin/productManagement/variant.model.js";
import orderModel from "./order.model.js";
import * as orderService from "./order.service.js";
import mongoose from "mongoose";

export const placeOrderCOD = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const order = await orderService.processCODOrder(userId, req.body);
        res.status(201).json({
            success: true,
            orderId: order._id,
            message: "Manifest deployed successfully."
        });
    } catch (error) {
        next(error);
    }
};

export const getUserOrders = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orders = await orderService.fetchUserHistory(userId);
        res.status(200).json({ success: true, orders: orders || [] });
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;
        const order = await orderService.fetchManifestDetails(orderId, userId);
        if (!order) return res.status(404).json({ success: false, message: "Manifest not found." });
        res.status(200).json({ success: true, order });
    } catch (error) {
        next(error);
    }
};

export const returnOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;


        const order = await orderModel.findOne({ _id: orderId, userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        if (order.status.toLowerCase() !== 'delivered') {
            return res.status(400).json({ success: false, message: "Only Delivered orders can be returned." });
        }

        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found." });

        await orderModel.updateOne(
            { _id: orderId, "items._id": itemId },
            { 
                $set: { 
                    "status": "delivered", 
                    "items.$.status": "Return Requested", 
                    "items.$.returnReason": reason,
                    "items.$.requestDate": new Date()
                }
            }
        );

        res.status(200).json({ success: true, message: "Return requested successfully." });
    } catch (error) {
        next(error);
    }
};

export const cancelOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;

        const order = await orderModel.findOne({ _id: orderId, userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        const currentStatus = order.status.toLowerCase();
        if (['shipped', 'delivered', 'cancelled', 'out_for_delivery'].includes(currentStatus)) {
            return res.status(400).json({ success: false, message: "Logistics state blocks cancellation." });
        }

        const item = order.items.id(itemId);
        if (!item || item.status === 'Cancelled') return res.status(400).json({ success: false, message: "Item already voided." });

        item.status = 'Cancelled';
        item.actionDate = new Date();

        if (order.paymentStatus === 'Paid') {
            order.paymentStatus = 'Refunded';
        }

        await variantModel.findOneAndUpdate(
            { _id: item.variantId, "sizes.size": item.size },
            { $inc: { "sizes.$.stock": item.quantity } }
        );

        order.totalAmount -= item.totalAmount;
        await order.save();

        res.status(200).json({ success: true, message: "Item cancelled and stock restored." });
    } catch (error) {
        next(error);
    }
};

export const cancelFullOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;

        const order = await orderModel.findOne({ _id: orderId, userId }).session(session);
        if (!order) throw new Error("Manifest not found.");

        const currentStatus = order.status.toLowerCase();
        if (['shipped', 'delivered', 'cancelled'].includes(currentStatus)) {
            throw new Error("Manifest state blocks full cancellation.");
        }

        for (const item of order.items) {
            if (item.status !== 'Cancelled') {
                item.status = 'Cancelled';
                item.reason = reason || "Full manifest voided";
                item.actionDate = new Date();

                await variantModel.findOneAndUpdate(
                    { _id: item.variantId, "sizes.size": item.size },
                    { $inc: { "sizes.$.stock": item.quantity } },
                    { session }
                );
            }
        }

        order.status = 'cancelled';

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Entire manifest voided." });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};