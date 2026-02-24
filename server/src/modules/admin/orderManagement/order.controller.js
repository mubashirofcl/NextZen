import Order from '../../user/order/order.model.js';
import Variant from '../../admin/productManagement/variant.model.js';
import * as orderRepository from './order.repository.js';
import mongoose from 'mongoose';
import { updateWalletBalance } from '../../user/wallet/wallet.service.js';

/**
 * 🟢 HELPER: Polymorphic Order Finder
 * Prevents "Cast to ObjectId failed" by checking if ID is a custom string or MongoID
 */
const findOrder = async (id, session = null) => {
    const query = typeof id === 'string' && id.startsWith("ORD-") 
        ? { orderNumber: id } 
        : { _id: id };
    
    return session ? Order.findOne(query).session(session) : Order.findOne(query);
};

// 1. GET ALL ORDERS
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

// 2. GET ORDER DETAILS (Fixed polymorphic search)
export const getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Pass the smart query to the repository
        const searchCriteria = id.startsWith("ORD-") ? { orderNumber: id } : { _id: id };
        const data = await orderRepository.getOrderDetailRepository(searchCriteria);
        
        if (!data) return res.status(404).json({ success: false, message: "Manifest not found." });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. UPDATE MANIFEST (Main Status & Refund Handler)
export const updateAdminManifest = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const idParam = req.params.orderId || req.params.id;
        const { globalStatus, itemId, itemStatus, paymentStatus } = req.body;

        // 🟢 FIX: Use polymorphic helper
        const order = await findOrder(idParam, session);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        if (paymentStatus) order.paymentStatus = paymentStatus;

        // ---------------------------------------------------------
        // 🟢 A. GLOBAL STATUS UPDATE
        // ---------------------------------------------------------
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
                    order.totalAmount = 0;
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

        // ---------------------------------------------------------
        // 🟢 B. ITEM SPECIFIC STATUS UPDATE (REFUND LOGIC)
        // ---------------------------------------------------------
        if (itemId && itemStatus) {
            const item = order.items.id(itemId);
            if (item) {
                const oldItemStatus = item.status;
                const targetItemStatus = itemStatus;

                if (['Returned', 'Cancelled'].includes(targetItemStatus) && oldItemStatus !== targetItemStatus) {
                    const safeSubTotal = order.subTotal || 0;
                    const safeDelivery = order.deliveryCharge || 0;
                    const calculatedDiscount = Math.max(0, (safeSubTotal + safeDelivery) - order.totalAmount);
                    const actualCouponDiscount = order.couponDiscount !== undefined ? order.couponDiscount : calculatedDiscount;

                    let itemDiscountShare = 0;
                    if (actualCouponDiscount > 0 && safeSubTotal > 0) {
                        itemDiscountShare = (item.totalAmount / safeSubTotal) * actualCouponDiscount;
                    }

                    let netRefund = item.totalAmount - itemDiscountShare;

                    if (targetItemStatus === 'Cancelled') {
                        const isShipped = ['shipped', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase());
                        const otherActiveItems = order.items.filter(i => i._id.toString() !== itemId && i.status !== 'Cancelled');
                        if (otherActiveItems.length === 0 && !isShipped && safeDelivery > 0) {
                            netRefund += safeDelivery;
                        }
                    }

                    if (order.paymentStatus === 'Paid' || order.paymentStatus === 'Refunded') {
                        await updateWalletBalance(
                            order.userId,
                            netRefund,
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

                    order.totalAmount = Math.max(0, order.totalAmount - netRefund);
                }

                item.status = targetItemStatus;
                item.actionDate = new Date();
            }
        }

        // 🟢 C. AUTO-UPDATE GLOBAL STATUS
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

// 4. AUTHORIZE ITEM REFUND (Fixed polymorphic search)
export const authorizeItemRefund = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId, itemId } = req.params;
        const order = await findOrder(orderId, session);
        const item = order.items.id(itemId);

        const refundAmount = item.totalAmount;

        await updateWalletBalance(
            order.userId,
            refundAmount,
            'credit',
            `Manual Refund Authorized: ${item.productId?.name}`,
            order._id,
            { session }
        );

        item.status = 'Returned';
        item.actionDate = new Date();
        order.totalAmount = Math.max(0, order.totalAmount - refundAmount);

        const allSettled = order.items.every(i => ['Returned', 'Cancelled'].includes(i.status));
        if (allSettled) {
            order.status = 'returned';
            order.paymentStatus = 'Refunded';
        }

        await order.save({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Refund Authorized" });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// 5. HANDLE RETURN APPROVAL (Fixed polymorphic search)
export const handleReturnApproval = async (req, res, next) => {
    try {
        const { orderId, itemId, action, comment } = req.body;
        const order = await findOrder(orderId);

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });

        if (action === 'approve') {
            item.status = "Return Approved";
            item.adminComment = comment || "Return request verified.";
        } else if (action === 'reject') {
            item.status = "Return Rejected";
            item.adminComment = comment || "Return policy requirements not met.";
        }

        await order.save();
        res.status(200).json({ success: true, message: `Item return request ${action}ed.` });
    } catch (error) {
        next(error);
    }
};

// 6. RETURN ITEM REQUEST (Fixed polymorphic search)
export const returnOrderItem = async (req, res, next) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;
        
        const order = await findOrder(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        if (order.status.toLowerCase() !== 'delivered') {
            return res.status(400).json({ success: false, message: "Only Delivered orders can be returned." });
        }

        // Use findOne and save instead of updateOne to handle subdocument logic cleanly
        const item = order.items.id(itemId);
        if (item) {
            item.status = "Return Requested";
            item.returnReason = reason || "Admin Initiated";
            item.requestDate = new Date();
            await order.save();
        }

        res.status(200).json({ success: true, message: "Return requested successfully." });
    } catch (error) {
        next(error);
    }
};