import variantModel from "../../admin/productManagement/variant.model.js";
import orderModel from "./order.model.js";
import paymentModel from "../payment/payment.model.js";
import cartModel from "../cart/cart.model.js";
import * as orderService from "./order.service.js";
import mongoose from "mongoose";
import { getWalletByUserId, updateWalletBalance } from "../wallet/wallet.service.js";

// 1. PLACE ORDER
export const placeOrder = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { razorpayOrderId, status, totals, items, addressId, paymentMethod, paymentInfo } = req.body;

        const orderStatus = status || 'pending';
        let initialPaymentStatus = (orderStatus === 'payment_failed') ? 'Failed' : 'Pending';

        if (paymentMethod === 'razorpay' && paymentInfo?.status === 'Paid') initialPaymentStatus = 'Paid';
        if (paymentMethod === 'wallet') initialPaymentStatus = 'Paid';

        const subTotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        const deliveryCharge = totals.deliveryCharge || 0;
        const finalTotalValue = subTotal + deliveryCharge;

        if (paymentMethod === 'wallet' && orderStatus !== 'payment_failed') {
            const wallet = await getWalletByUserId(userId);
            if (wallet.balance < finalTotalValue) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance." });
            }
            await updateWalletBalance(userId, finalTotalValue, 'debit', 'Order placement', null);
        }

        const processedItems = items.map(item => ({
            ...item,
            price: item.price,
            tax: 0,
            totalAmount: item.price * item.quantity
        }));

        let order;
        if (paymentMethod === 'razorpay' && razorpayOrderId) {
            order = await orderModel.findOne({ razorpayOrderId });
        }

        if (order) {
            order.status = orderStatus;
            order.paymentStatus = initialPaymentStatus;
            order.items = processedItems;
            order.subTotal = subTotal;
            order.tax = 0;
            order.totalAmount = finalTotalValue;
            await order.save();
        } else {
            order = new orderModel({
                userId,
                addressId,
                items: processedItems,
                orderNumber: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                razorpayOrderId: razorpayOrderId || null,
                paymentMethod,
                paymentStatus: initialPaymentStatus,
                subTotal,
                tax: 0,
                totalDiscount: totals.totalDiscount || 0,
                totalAmount: finalTotalValue,
                deliveryCharge,
                status: orderStatus
            });
            await order.save();
        }

        await paymentModel.create({
            orderId: order._id, userId, amount: finalTotalValue, method: paymentMethod,
            status: initialPaymentStatus === 'Paid' ? 'success' : (orderStatus === 'payment_failed' ? 'failed' : 'pending'),
            razorpayOrderId, razorpayPaymentId: paymentInfo?.id || (paymentMethod === 'wallet' ? 'WALLET_TRANSACTION' : null),
            rawResponse: paymentInfo || { method: paymentMethod }
        });

        if (orderStatus === 'pending' || orderStatus === 'confirmed') {
            for (const item of processedItems) {
                await variantModel.findOneAndUpdate({ _id: item.variantId, "sizes.size": item.size }, { $inc: { "sizes.$.stock": -item.quantity } });
            }
            await cartModel.findOneAndUpdate({ userId }, { items: [], subtotal: 0 });
        }
        res.status(201).json({ success: true, orderId: order._id });
    } catch (error) { next(error); }
};

// 2. COMPLETE RETRY
export const completeRetry = async (req, res, next) => {
    try {
        const idIdentifier = req.params.orderId;
        const { paymentInfo, newRazorpayOrderId } = req.body;
        const order = await orderModel.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(idIdentifier) ? idIdentifier : null },
                { razorpayOrderId: idIdentifier }
            ]
        });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });
        if (newRazorpayOrderId) order.razorpayOrderId = newRazorpayOrderId;
        if (order.status === 'payment_failed') {
            order.status = 'pending';
            order.paymentStatus = 'Paid';
            await paymentModel.create({
                orderId: order._id, userId: order.userId, amount: order.totalAmount,
                method: "razorpay", status: "success", razorpayOrderId: order.razorpayOrderId,
                razorpayPaymentId: paymentInfo.razorpay_payment_id,
                razorpaySignature: paymentInfo.razorpay_signature, rawResponse: paymentInfo
            });
            for (const item of order.items) {
                await variantModel.findOneAndUpdate({ _id: item.variantId, "sizes.size": item.size }, { $inc: { "sizes.$.stock": -item.quantity } });
            }
            await order.save();
            await cartModel.findOneAndUpdate({ userId: order.userId }, { items: [], subtotal: 0, totalMarketPrice: 0 });
        }
        res.status(200).json({ success: true, orderId: order._id, message: "Success" });
    } catch (error) { next(error); }
};

// 3. GET USER ORDERS
export const getUserOrders = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orders = await orderService.fetchUserHistory(userId);
        res.status(200).json({ success: true, orders: orders || [] });
    } catch (error) { next(error); }
};

// 4. GET ORDER BY ID
export const getOrderById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { orderId } = req.params;
        const order = await orderService.fetchManifestDetails(orderId, userId);
        if (!order) return res.status(404).json({ success: false, message: "Manifest not found." });
        res.status(200).json({ success: true, order });
    } catch (error) { next(error); }
};

// 5. CANCEL ITEM (FIXED: Frozen Price Details)
export const cancelOrderItem = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId, itemId } = req.params;
        const userId = req.user.userId;

        const order = await orderModel.findOne({ _id: orderId, userId }).session(session);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        if (['shipped', 'delivered', 'cancelled', 'out_for_delivery'].includes(order.status.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Logistics state blocks cancellation." });
        }

        const item = order.items.id(itemId);
        if (!item || item.status === 'Cancelled') return res.status(400).json({ success: false, message: "Item already voided." });

        // Calculate refund amount based on shipping rules
        const isShipped = ['shipped', 'out_for_delivery'].includes(order.status.toLowerCase());
        const otherActiveItems = order.items.filter(i => i.status !== 'Cancelled' && i._id.toString() !== itemId);
        const isLastItem = otherActiveItems.length === 0;

        let finalRefundAmount = item.totalAmount;
        if (isLastItem && order.deliveryCharge > 0 && !isShipped) {
            finalRefundAmount += order.deliveryCharge;
        }

        // Process Wallet Refund
        if (order.paymentStatus === 'Paid') {
            await updateWalletBalance(userId, finalRefundAmount, 'credit', `Refund: ${item.productId?.name}`, order._id, { session });
        }

        // 🟢 UPDATE ONLY STATUS & INVENTORY
        item.status = 'Cancelled';
        item.actionDate = new Date();

        await variantModel.findOneAndUpdate(
            { _id: item.variantId, "sizes.size": item.size },
            { $inc: { "sizes.$.stock": item.quantity } },
            { session }
        );

        if (isLastItem) {
            order.status = 'cancelled';
            order.paymentStatus = (order.paymentStatus === 'Paid' || order.paymentStatus === 'Refunded') ? 'Refunded' : 'Cancelled';
        }

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: `₹${finalRefundAmount} refunded.` });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 6. RETURN ITEM
export const returnOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const order = await orderModel.findOne({ _id: orderId, userId });
        if (!order || order.status.toLowerCase() !== 'delivered') return res.status(400).json({ success: false, message: "Invalid return request." });
        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found." });

        await orderModel.updateOne(
            { _id: orderId, "items._id": itemId },
            { $set: { "items.$.status": "Return Requested", "items.$.returnReason": reason, "items.$.requestDate": new Date() } }
        );
        res.status(200).json({ success: true, message: "Return requested." });
    } catch (error) { next(error); }
};

// 7. FINALIZE RETURN REFUND (Always Deducts Shipping as it was delivered)
export const finalizeReturnRefund = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId, itemId } = req.params;
        const order = await orderModel.findById(orderId).session(session);
        const item = order.items.id(itemId);
        if (item.status !== 'Return Approved') return res.status(400).json({ success: false, message: "Return not approved." });

        // Returns only refund item amount, NEVER the shipping fee
        const refundAmount = item.totalAmount;

        await updateWalletBalance(order.userId, refundAmount, 'credit', `Return Refund: ${item.productId?.name}`, order._id, { session });

        item.status = 'Returned';
        item.actionDate = new Date();

        order.totalAmount = Math.max(0, order.totalAmount - refundAmount);
        order.subTotal = Math.max(0, order.subTotal - item.totalAmount);

        const allSettled = order.items.every(i => ['Returned', 'Cancelled'].includes(i.status));
        if (allSettled) {
            order.status = 'returned';
            order.paymentStatus = 'Refunded';
            // Note: deliveryCharge is kept by store because logistics were completed.
        }
        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: `₹${refundAmount} refunded.` });
    } catch (error) { await session.abortTransaction(); next(error); } finally { session.endSession(); }
};

// 8. CANCEL FULL ORDER (FIXED: Frozen Price Details)
export const cancelFullOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;
        const order = await orderModel.findOne({ _id: orderId, userId }).session(session);

        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        const isShipped = ['shipped', 'out_for_delivery'].includes(order.status.toLowerCase());

        // Calculate refund: If shipped, user loses delivery charge.
        let refundTotal = isShipped ? order.subTotal : order.totalAmount;

        if (order.paymentStatus === 'Paid') {
            await updateWalletBalance(
                userId,
                refundTotal,
                'credit',
                `Full refund (Shipment: ${isShipped ? 'Deducted' : 'Included'})`,
                order._id,
                { session }
            );
            order.paymentStatus = 'Refunded';
        }

        // Update all items to Cancelled
        for (const item of order.items) {
            if (item.status !== 'Cancelled') {
                await variantModel.findOneAndUpdate(
                    { _id: item.variantId, "sizes.size": item.size },
                    { $inc: { "sizes.$.stock": item.quantity } },
                    { session }
                );
                item.status = 'Cancelled';
                item.actionDate = new Date();
            }
        }

        order.status = 'cancelled';

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: `Order cancelled. Refund: ₹${refundTotal}` });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 9. PLACE COD ORDER
export const placeOrderCOD = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orderData = req.body;
        const order = await orderService.processCODOrder(userId, { ...orderData, status: orderData.status || 'pending' });
        res.status(201).json({ success: true, orderId: order._id });
    } catch (error) { next(error); }
};