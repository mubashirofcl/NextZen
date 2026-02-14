import variantModel from "../../admin/productManagement/variant.model.js";
import orderModel from "./order.model.js";
import paymentModel from "../payment/payment.model.js";
import cartModel from "../cart/cart.model.js";
import * as orderService from "./order.service.js";
import mongoose from "mongoose";

export const placeOrder = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { razorpayOrderId, status, totals, items, addressId, paymentMethod, paymentInfo } = req.body;

        const orderStatus = status || 'pending';
        let initialPaymentStatus = (orderStatus === 'payment_failed') ? 'Failed' : 'Pending';
        if (paymentMethod === 'razorpay' && paymentInfo?.status === 'Paid') initialPaymentStatus = 'Paid';

        let order = await orderModel.findOne({ razorpayOrderId });

        if (order) {
            order.status = orderStatus;
            order.paymentStatus = initialPaymentStatus;
            await order.save();
        } else {
            order = new orderModel({
                userId, addressId, items,
                orderNumber: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                razorpayOrderId, paymentMethod, paymentStatus: initialPaymentStatus,
                subTotal: totals.totalMarketPrice || totals.subtotal,
                totalDiscount: totals.totalDiscount,
                totalAmount: totals.totalAmount,
                deliveryCharge: totals.deliveryCharge,
                status: orderStatus
            });
            await order.save();
        }

        // 🟢 NEW: Create Payment Record
        await paymentModel.create({
            orderId: order._id,
            userId: userId,
            amount: totals.totalAmount,
            method: paymentMethod,
            status: initialPaymentStatus === 'Paid' ? 'success' : (orderStatus === 'payment_failed' ? 'failed' : 'pending'),
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: paymentInfo?.id || null,
            rawResponse: paymentInfo || {}
        });

        if (orderStatus === 'pending') {
            for (const item of items) {
                await variantModel.findOneAndUpdate(
                    { _id: item.variantId, "sizes.size": item.size },
                    { $inc: { "sizes.$.stock": -item.quantity } }
                );
            }
            await cartModel.findOneAndUpdate({ userId }, { items: [], subtotal: 0, totalMarketPrice: 0 });
        }

        res.status(201).json({ success: true, orderId: order._id });
    } catch (error) {
        next(error);
    }
};

export const completeRetry = async (req, res, next) => {
    try {
        // This variable might contain a MongoDB _id or a Razorpay order_id
        const idIdentifier = req.params.orderId;
        const { paymentInfo } = req.body;

        // 🟢 FIXED: Search by EITHER _id OR razorpayOrderId to prevent 404s
        const order = await orderModel.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(idIdentifier) ? idIdentifier : null },
                { razorpayOrderId: idIdentifier }
            ]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found in manifest." });
        }

        // 🟢 LOGIC LOCK: Only process if the status is currently 'payment_failed'
        // This prevents stock from being reduced twice if the user double-clicks
        if (order.status === 'payment_failed') {
            order.status = 'pending';
            order.paymentStatus = 'Paid';

            // Create Transaction Record
            await paymentModel.create({
                orderId: order._id,
                userId: order.userId,
                amount: order.totalAmount,
                method: "razorpay",
                status: "success",
                razorpayOrderId: order.razorpayOrderId,
                razorpayPaymentId: paymentInfo.razorpay_payment_id,
                razorpaySignature: paymentInfo.razorpay_signature,
                rawResponse: paymentInfo
            });

            // Inventory Adjustment
            for (const item of order.items) {
                await variantModel.findOneAndUpdate(
                    { _id: item.variantId, "sizes.size": item.size },
                    { $inc: { "sizes.$.stock": -item.quantity } }
                );
            }

            // Save order updates
            await order.save();

            // Clear User Cart/Bag
            await cartModel.findOneAndUpdate(
                { userId: order.userId },
                { items: [], subtotal: 0, totalMarketPrice: 0 }
            );
        }

        // 🟢 Return success with the MongoDB _id for frontend navigation
        res.status(200).json({
            success: true,
            orderId: order._id,
            message: "Protocol synchronized successfully."
        });
    } catch (error) {
        next(error);
    }
};

export const placeOrderCOD = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orderData = req.body;

        const order = await orderService.processCODOrder(userId, {
            ...orderData,
            status: orderData.status || 'pending'
        });

        res.status(201).json({
            success: true,
            orderId: order._id,
            message: order.status === 'payment_failed' ? "Order logged as failed." : "Order placed successfully."
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

        await variantModel.findOneAndUpdate(
            { _id: item.variantId, "sizes.size": item.size },
            { $inc: { "sizes.$.stock": item.quantity } }
        );

        order.totalAmount -= item.totalAmount;
        const hasActiveItems = order.items.some(i => i.status !== 'Cancelled');

        if (!hasActiveItems) {
            order.status = 'cancelled';
            order.paymentStatus = order.paymentStatus === 'Paid' ? 'Refunded' : 'Cancelled';
        }

        await order.save();
        res.status(200).json({
            success: true,
            message: !hasActiveItems ? "Order fully cancelled." : "Item cancelled and stock restored."
        });
    } catch (error) {
        next(error);
    }
};

export const cancelFullOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId } = req.params;
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
                item.actionDate = new Date();
                await variantModel.findOneAndUpdate(
                    { _id: item.variantId, "sizes.size": item.size },
                    { $inc: { "sizes.$.stock": item.quantity } },
                    { session }
                );
            }
        }

        order.status = 'cancelled';
        order.paymentStatus = order.paymentStatus === 'Paid' ? 'Refunded' : 'Cancelled';

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