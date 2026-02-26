import variantModel from "../../admin/productManagement/variant.model.js";
import orderModel from "./order.model.js";
import paymentModel from "../payment/payment.model.js";
import cartModel from "../cart/cart.model.js";
import * as orderService from "./order.service.js";
import mongoose from "mongoose";
import { getWalletByUserId, updateWalletBalance } from "../wallet/wallet.service.js";
import couponModel from "../../admin/couponManagemen/coupon.model.js";

const fixNum = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const placeOrder = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {
            razorpayOrderId, status, totals, items, addressId, paymentMethod, paymentInfo, couponCode
        } = req.body;

        const orderStatus = status || 'pending';

        const subTotal = fixNum(items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0));
        const deliveryCharge = fixNum(totals.deliveryCharge || 0);

        let discountAmount = 0;
        if (couponCode) {
            const coupon = await couponModel.findOne({ code: couponCode, isActive: true });
            if (coupon) {
                const now = new Date();
                if (coupon.endDate >= now && subTotal >= coupon.minPurchaseAmt) {
                    if (coupon.discountType === 'PERCENT') {
                        discountAmount = fixNum((subTotal * coupon.discountValue) / 100);
                        if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                    } else {
                        discountAmount = fixNum(coupon.discountValue);
                    }
                }
            }
        }

        const finalTotalValue = Math.max(0, fixNum((subTotal + deliveryCharge) - discountAmount));

        let initialPaymentStatus = (orderStatus === 'payment_failed') ? 'Failed' : 'Pending';
        if (paymentMethod === 'razorpay' && paymentInfo?.status === 'Paid') initialPaymentStatus = 'Paid';
        if (paymentMethod === 'wallet') initialPaymentStatus = 'Paid';

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
            totalAmount: fixNum(item.price * item.quantity),
            status: "Placed"
        }));

        let order;
        if (paymentMethod === 'razorpay' && razorpayOrderId) {
            order = await orderModel.findOne({ razorpayOrderId });
        }

        const orderPayload = {
            userId,
            addressId,
            items: processedItems,
            orderNumber: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            razorpayOrderId: razorpayOrderId || null,
            paymentMethod,
            paymentStatus: initialPaymentStatus,
            subTotal,
            totalDiscount: fixNum(totals.totalDiscount || 0),
            couponCode: couponCode || null,
            couponDiscount: discountAmount,
            totalAmount: finalTotalValue,
            deliveryCharge,
            status: orderStatus
        };

        if (order) {
            Object.assign(order, orderPayload);
            await order.save();
        } else {
            order = new orderModel(orderPayload);
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
            if (couponCode) await couponModel.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
            await cartModel.findOneAndUpdate({ userId }, { items: [], subtotal: 0 });
        }

        res.status(201).json({ success: true, orderId: order._id });
    } catch (error) { next(error); }
};

export const completeRetry = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const idIdentifier = req.params.orderId;
        const { paymentInfo, newRazorpayOrderId } = req.body;

        const order = await orderModel.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(idIdentifier) ? idIdentifier : null },
                { razorpayOrderId: idIdentifier }
            ]
        }).session(session);

        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (order.paymentStatus === 'Paid') {
            await session.abortTransaction();
            return res.status(200).json({ success: true, orderId: order._id, message: "Already processed" });
        }

        for (const item of order.items) {
            const variant = await variantModel.findOne({
                _id: item.variantId,
                "sizes.size": item.size
            }).session(session);

            const sizeData = variant?.sizes.find(s => s.size === item.size);
            if (!sizeData || sizeData.stock < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Stock conflict: ${item.size} is currently out of stock.`
                });
            }
        }

        let couponWarning = "";
        if (order.couponCode) {
            const coupon = await couponModel.findOne({ code: order.couponCode, isActive: true }).session(session);
            const now = new Date();
            
            const isInvalid = !coupon || 
                             coupon.endDate < now || 
                             coupon.usedCount >= coupon.usageLimit || 
                             order.subTotal < coupon.minPurchaseAmt;

            if (isInvalid) {
                couponWarning = "Coupon has expired/blocked. Order adjusted to standard price.";
                order.couponCode = null;
                order.couponDiscount = 0;
                order.totalAmount = fixNum(order.subTotal + order.deliveryCharge);
            }
        }

        if (newRazorpayOrderId) order.razorpayOrderId = newRazorpayOrderId;
        order.status = 'pending';
        order.paymentStatus = 'Paid';

        await paymentModel.create([{
            orderId: order._id, userId: order.userId, amount: order.totalAmount,
            method: "razorpay", status: "success", razorpayOrderId: order.razorpayOrderId,
            razorpayPaymentId: paymentInfo.razorpay_payment_id,
            razorpaySignature: paymentInfo.razorpay_signature, rawResponse: paymentInfo
        }], { session });

        for (const item of order.items) {
            await variantModel.findOneAndUpdate(
                { _id: item.variantId, "sizes.size": item.size },
                { $inc: { "sizes.$.stock": -item.quantity } },
                { session }
            );
        }

        if (order.couponCode) {
            await couponModel.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: 1 } }, { session });
        }

        await order.save({ session });
        await cartModel.findOneAndUpdate({ userId: order.userId }, { items: [], subtotal: 0, totalMarketPrice: 0 }, { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, orderId: order._id, warning: couponWarning });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

export const cancelOrderItem = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId, itemId } = req.params;
        const order = await orderModel.findOne({ _id: orderId, userId: req.user.userId }).session(session);

        if (!order || ['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ success: false, message: "Action not allowed in current state." });
        }

        const item = order.items.id(itemId);
        if (!item || item.status === 'Cancelled') return res.status(400).json({ success: false, message: "Item already cancelled." });

        if (order.couponCode) {
            const coupon = await couponModel.findOne({ code: order.couponCode });
            if (coupon && coupon.minPurchaseAmt) {
                const activeItems = order.items.filter(i => i.status !== 'Cancelled' && i._id.toString() !== itemId);
                const potentialSubTotal = fixNum(activeItems.reduce((acc, curr) => acc + curr.totalAmount, 0));

                if (activeItems.length > 0 && potentialSubTotal < coupon.minPurchaseAmt) {
                    await session.abortTransaction();
                    return res.status(400).json({
                        success: false,
                        message: `Cannot cancel. Remaining order total (₹${potentialSubTotal}) would fall below the ₹${coupon.minPurchaseAmt} minimum required for coupon "${order.couponCode}".`
                    });
                }
            }
        }

        const safeSubTotal = fixNum(order.subTotal || 0);
        const actualCouponDiscount = fixNum(order.couponDiscount || 0);

        let itemDiscountShare = 0;
        if (actualCouponDiscount > 0 && safeSubTotal > 0) {
            itemDiscountShare = fixNum((item.totalAmount / safeSubTotal) * actualCouponDiscount);
        }

        let refundAmount = fixNum(item.totalAmount - itemDiscountShare);

        const otherActiveItems = order.items.filter(i => i.status !== 'Cancelled' && i._id.toString() !== itemId);
        const isLastItem = otherActiveItems.length === 0;

        if (isLastItem && order.deliveryCharge > 0) {
            refundAmount = fixNum(refundAmount + order.deliveryCharge);
        }

        if (order.paymentStatus === 'Paid') {
            await updateWalletBalance(req.user.userId, refundAmount, 'credit', `Refund: ${item.productId?.name}`, order._id, { session });
        }

        item.status = 'Cancelled';
        item.actionDate = new Date();

        await variantModel.findOneAndUpdate(
            { _id: item.variantId, "sizes.size": item.size },
            { $inc: { "sizes.$.stock": item.quantity } },
            { session }
        );

        order.totalAmount = fixNum(Math.max(0, order.totalAmount - refundAmount));
        order.subTotal = fixNum(Math.max(0, order.subTotal - item.totalAmount));
        if (order.couponDiscount) order.couponDiscount = fixNum(Math.max(0, order.couponDiscount - itemDiscountShare));

        if (isLastItem) {
            order.status = 'cancelled';
            order.paymentStatus = 'Refunded';
        }

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: `₹${refundAmount.toFixed(2)} refunded.` });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

export const finalizeReturnRefund = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId, itemId } = req.params;
        const order = await orderModel.findById(orderId).session(session);
        const item = order.items.id(itemId);

        if (item.status !== 'Return Approved') return res.status(400).json({ success: false, message: "Return not approved." });

        const safeSubTotal = fixNum(order.subTotal || 0);
        const actualCouponDiscount = fixNum(order.couponDiscount || 0);

        let itemDiscountShare = 0;
        if (actualCouponDiscount > 0 && safeSubTotal > 0) {
            itemDiscountShare = fixNum((item.totalAmount / safeSubTotal) * actualCouponDiscount);
        }

        const netRefund = fixNum(item.totalAmount - itemDiscountShare);

        await updateWalletBalance(order.userId, netRefund, 'credit', `Return Refund: ${item.productId?.name}`, order._id, { session });

        item.status = 'Returned';
        item.actionDate = new Date();

        order.totalAmount = fixNum(Math.max(0, order.totalAmount - netRefund));
        order.subTotal = fixNum(Math.max(0, order.subTotal - item.totalAmount));
        if (order.couponDiscount) order.couponDiscount = fixNum(Math.max(0, order.couponDiscount - itemDiscountShare));

        if (order.items.every(i => ['Returned', 'Cancelled'].includes(i.status))) {
            order.status = 'returned';
            order.paymentStatus = 'Refunded';
        }

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: `₹${netRefund.toFixed(2)} refunded to wallet.` });
    } catch (error) { await session.abortTransaction(); next(error); } finally { session.endSession(); }
};

export const cancelFullOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId } = req.params;
        const order = await orderModel.findOne({ _id: orderId, userId: req.user.userId }).session(session);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        const isShipped = ['shipped', 'out_for_delivery'].includes(order.status.toLowerCase());

        let refundTotal = fixNum(order.totalAmount);

        if (isShipped && order.deliveryCharge > 0) {
            refundTotal = fixNum(Math.max(0, refundTotal - order.deliveryCharge));
        }

        if (order.paymentStatus === 'Paid') {
            await updateWalletBalance(req.user.userId, refundTotal, 'credit', `Full Order Refund`, order._id, { session });
            order.paymentStatus = 'Refunded';
        }

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
        res.status(200).json({ success: true, message: `Refund: ₹${refundTotal.toFixed(2)}` });
    } catch (error) { await session.abortTransaction(); next(error); } finally { session.endSession(); }
};

export const getUserOrders = async (req, res, next) => {
    try {
        const orders = await orderService.fetchUserHistory(req.user.userId);
        res.status(200).json({ success: true, orders: orders || [] });
    } catch (error) { next(error); }
};

export const getOrderById = async (req, res, next) => {
    try {
        const order = await orderService.fetchManifestDetails(req.params.orderId, req.user.userId);
        if (!order) return res.status(404).json({ success: false, message: "Manifest not found." });
        res.status(200).json({ success: true, order });
    } catch (error) { next(error); }
};

export const returnOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const order = await orderModel.findOne({ _id: orderId, userId: req.user.userId });
        if (!order || order.status.toLowerCase() !== 'delivered') return res.status(400).json({ success: false, message: "Invalid request." });

        await orderModel.updateOne(
            { _id: orderId, "items._id": itemId },
            { $set: { "items.$.status": "Return Requested", "items.$.returnReason": req.body.reason, "items.$.requestDate": new Date() } }
        );
        res.status(200).json({ success: true, message: "Return requested." });
    } catch (error) { next(error); }
};

export const placeOrderCOD = async (req, res, next) => {
    try {
        const order = await orderService.processCODOrder(req.user.userId, {
            ...req.body,
            status: 'pending',
            couponCode: req.body.couponCode
        });
        res.status(201).json({ success: true, orderId: order._id });
    } catch (error) { next(error); }
};