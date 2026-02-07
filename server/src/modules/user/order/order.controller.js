import variantModel from "../../admin/productManagement/variant.model.js";
import orderModel from "./order.model.js";
import * as orderService from "./order.service.js";

export const placeOrderCOD = async (req, res) => {
    try {
        // FIX: Consistently use userId
        const userId = req.user.userId;
        const order = await orderService.processCODOrder(userId, req.body);

        res.status(201).json({ success: true, orderId: order._id, message: "Order deployed." });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        // FIX: Changed from req.user.id to req.user.userId
        const userId = req.user.userId;
        const orders = await orderService.fetchUserHistory(userId);
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Archive retrieval failed." });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const order = await orderService.fetchManifestDetails(req.params.orderId, userId);

        if (!order) return res.status(404).json({ success: false, message: "Manifest not found." });
        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;

        const order = await orderModel.findById(orderId);
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ success: false, message: "Order state blocks cancellation." });
        }

        const item = order.items.id(itemId);
        if (!item || item.status === 'cancelled') return res.status(400).json({ success: false });

        // 1. Update State
        item.status = 'cancelled';
        item.reason = reason || "User requested";
        item.actionDate = new Date();

        // 2. 🛡️ ATOMIC STOCK RESTORATION
        await variantModel.findOneAndUpdate(
            { _id: item.variantId, "sizes.size": item.size },
            { $inc: { "sizes.$.stock": item.quantity } }
        );

        // 3. Update Order Total
        order.totalAmount -= item.totalAmount;
        await order.save();

        res.status(200).json({ success: true, message: "Item cancelled and stock restored." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const returnOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ success: false, message: "Reason is mandatory." });

        const order = await orderModel.findById(orderId);
        if (order.status !== 'delivered') return res.status(400).json({ success: false, message: "Only delivered items can be returned." });

        const item = order.items.id(itemId);
        item.status = 'return_requested';
        item.refundStatus = 'refund_pending';
        item.refundAmount = item.totalAmount;
        item.reason = reason;
        item.actionDate = new Date();

        await order.save();
        res.status(200).json({ success: true, message: "Return requested; Refund protocol initiated." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelFullOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await orderModel.findById(orderId).session(session);
        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Manifest not found" });
        }

        // Security Guard: Prevent cancellation if logistics have moved too far
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Order in '${order.status}' state cannot be voided.`
            });
        }

        // Process every item in the manifest
        for (const item of order.items) {
            if (item.status !== 'cancelled') {
                // 1. Restore Stock Atomically
                const updateStock = await variantModel.findOneAndUpdate(
                    { _id: item.variantId, "sizes.size": item.size },
                    { $inc: { "sizes.$.stock": item.quantity } },
                    { session, new: true }
                );

                if (!updateStock) {
                    throw new Error(`Inventory sync failed for asset: ${item.variantId}`);
                }

                // 2. Log item status
                item.status = 'cancelled';
                item.reason = reason || "Global manifest voided by user";
                item.actionDate = new Date();
            }
        }

        // 3. Finalize Global Order State
        order.status = 'cancelled';
        order.totalAmount = 0; // Clear payable amount

        await order.save({ session });

        // Commit all changes to the database
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Manifest voided successfully. Inventory restored to warehouse."
        });

    } catch (error) {
        // 🛡️ If anything fails, NO changes are made to the DB
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};