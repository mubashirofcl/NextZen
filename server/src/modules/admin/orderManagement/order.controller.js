import Order from '../../user/order/order.model.js';
import Variant from '../../admin/productManagement/variant.model.js';
import * as orderRepository from './order.repository.js';
import mongoose from 'mongoose';
import { updateWalletBalance } from '../../user/wallet/wallet.service.js';

export const getAllOrders = async (req, res) => {
    try {
        const result = await orderRepository.getAdminOrdersRepository(req.query);
        res.status(200).json({
            success: true,
            orders: result.orders,
            totalOrders: result.totalCount,
            totalPages: Math.ceil(result.totalCount / (req.query.limit || 10)),
            currentPage: Number(req.query.page || 1)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await orderRepository.getOrderDetailRepository(id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Manifest not found." });
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdminManifest = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const orderId = req.params.orderId || req.params.id;
        const { globalStatus, itemId, itemStatus, paymentStatus } = req.body;

        const order = await Order.findById(orderId).session(session);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        if (paymentStatus) order.paymentStatus = paymentStatus;

        if (globalStatus) {
            const normalizedGlobal = globalStatus.toLowerCase();
            const oldGlobalStatus = order.status;
            order.status = normalizedGlobal;

            if (normalizedGlobal === 'delivered' && order.paymentMethod === 'cashOnDelivery') {
                order.paymentStatus = 'Paid';
            }

            if (normalizedGlobal === 'cancelled' && oldGlobalStatus !== 'cancelled') {
                if (order.paymentStatus === 'Paid') {
                    await updateWalletBalance(
                        order.userId,
                        order.totalAmount,
                        'credit',
                        `Full refund for order cancellation by Admin #${order.orderNumber}`,
                        order._id,
                        { session }
                    );
                    order.paymentStatus = 'Refunded';
                }

                for (const item of order.items) {
                    if (item.status !== 'Cancelled') {
                        item.status = 'Cancelled';
                        await Variant.findOneAndUpdate(
                            { _id: item.variantId, "sizes.size": item.size },
                            { $inc: { "sizes.$.stock": item.quantity } },
                            { session }
                        );
                    }
                }
            } else {
                order.items.forEach(item => {
                    if (!["Cancelled", "Returned", "Return Approved", "Return Rejected"].includes(item.status)) {
                        if (normalizedGlobal === "confirmed") item.status = "Placed";
                        else if (normalizedGlobal === "shipped") item.status = "Shipped";
                        else if (normalizedGlobal === "delivered") item.status = "Delivered";
                    }
                });
            }
        }

        if (itemId && itemStatus) {
            const item = order.items.id(itemId);
            if (item) {
                const oldItemStatus = item.status;
                const targetItemStatus = itemStatus;

                if (['Returned', 'Cancelled'].includes(targetItemStatus) && oldItemStatus !== targetItemStatus) {
                    if (order.paymentStatus === 'Paid' || order.paymentStatus === 'Refunded') {
                        await updateWalletBalance(
                            order.userId,
                            item.totalAmount,
                            'credit',
                            `Refund for item ${targetItemStatus.toLowerCase()}: ${item.productId?.name}`,
                            order._id,
                            { session }
                        );
                    }

                    await Variant.findOneAndUpdate(
                        { _id: item.variantId, "sizes.size": item.size },
                        { $inc: { "sizes.$.stock": item.quantity } },
                        { session }
                    );
                }

                item.status = targetItemStatus;
                item.actionDate = new Date();
            }
        }

        const allItems = order.items;
        const totalItems = allItems.length;
        const cancelledCount = allItems.filter(i => i.status === 'Cancelled').length;
        const returnedCount = allItems.filter(i => i.status === 'Returned').length;

        if (cancelledCount === totalItems) {
            order.status = 'cancelled';
            if (order.paymentStatus === 'Paid') order.paymentStatus = 'Refunded';
        } else if (returnedCount === totalItems || (cancelledCount + returnedCount === totalItems)) {
            order.status = 'returned';
            if (order.paymentStatus === 'Paid') order.paymentStatus = 'Refunded';
        }

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Ledger and Stock synchronized." });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

export const authorizeItemRefund = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId, itemId } = req.params;
        const order = await Order.findById(orderId).session(session);
        const item = order.items.id(itemId);

        const itemTaxRefund = Math.round(item.totalAmount * 0.18);
        const totalRefundToWallet = item.totalAmount + itemTaxRefund;

        await updateWalletBalance(
            order.userId,
            totalRefundToWallet,
            'credit',
            `Refund (incl. GST) for: ${item.productId?.name}`,
            order._id,
            { session }
        );

        item.status = 'Returned';
        item.actionDate = new Date();

        const allSettled = order.items.every(i => ['Returned', 'Cancelled'].includes(i.status));
        if (allSettled) {
            order.status = 'returned';
            order.paymentStatus = 'Refunded';
        }

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Refund with Tax Authorized" });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};


export const handleReturnApproval = async (req, res, next) => {
    try {
        const { orderId, itemId, action, comment } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });

        const oldStatus = item.status; // Track logic

        if (action === 'approve') {
            item.status = "Return Approved";
            item.adminComment = comment || "Return request verified.";
        } else if (action === 'reject') {
            item.status = "Return Rejected";
            item.adminComment = comment || "Return policy requirements not met.";
        } else if (action === 'complete') {
            item.status = "Returned";

            if (oldStatus !== 'Returned') {
                await Variant.findOneAndUpdate(
                    { _id: item.variantId, "sizes.size": item.size },
                    { $inc: { "sizes.$.stock": item.quantity } }
                );
            }
        }


        const allItems = order.items;
        const allReturnedOrCancelled = allItems.length > 0 && allItems.every(i => ['Returned', 'Cancelled'].includes(i.status));

        if (allReturnedOrCancelled) {
            order.status = 'returned';

            if (order.paymentStatus === 'Paid') {
                order.paymentStatus = 'Refunded';
            }
        }

        await order.save();
        res.status(200).json({ success: true, message: `Manifest item ${action}ed.` });
    } catch (error) {
        next(error);
    }
};

export const returnOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        if (order.status.toLowerCase() !== 'delivered') {
            return res.status(400).json({ success: false, message: "Only Delivered orders can be returned." });
        }

        await Order.updateOne(
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