import Order from '../../user/order/order.model.js';
import Variant from '../../admin/productManagement/variant.model.js';
import * as orderRepository from './order.repository.js';

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
    try {
        const orderId = req.params.orderId || req.params.id;
        const { globalStatus, itemId, itemStatus } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Server Error: Order ID missing." });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });

        if (globalStatus) {
            const normalizedGlobal = globalStatus.toLowerCase();
            order.status = normalizedGlobal;

            order.items.forEach(item => {
                const s = item.status;

                if (!["Cancelled", "Returned", "Return Approved", "Return Rejected"].includes(s)) {
                    if (normalizedGlobal === "confirmed") item.status = "Placed";
                    else if (normalizedGlobal === "shipped") item.status = "Shipped";
                    else if (normalizedGlobal === "out_for_delivery") item.status = "Shipped";
                    else if (normalizedGlobal === "delivered") item.status = "Delivered";
                    else if (normalizedGlobal === "cancelled") item.status = "Cancelled";
                }
            });
        }

        if (itemId && itemStatus) {
            const item = order.items.id(itemId);

            if (item) {

                const statusMap = {
                    'return requested': 'Return Requested',
                    'return approved': 'Return Approved',
                    'return rejected': 'Return Rejected',
                    'returned': 'Returned',
                    'delivered': 'Delivered',
                    'cancelled': 'Cancelled',
                    'shipped': 'Shipped',
                    'placed': 'Placed'
                };

                const targetStatus = statusMap[itemStatus.toLowerCase()] || itemStatus;

                item.status = targetStatus;
                item.actionDate = new Date();

                if (targetStatus === 'Returned') {
                    await Variant.findOneAndUpdate(
                        { _id: item.variantId, "sizes.size": item.size },
                        { $inc: { "sizes.$.stock": item.quantity } }
                    );
                }
            }
        }

        const allItems = order.items;
        const isFullyReturned = allItems.length > 0 && allItems.every(i => i.status === 'Returned');

        const isFullyCancelled = allItems.length > 0 && allItems.every(i => i.status === 'Cancelled');

        if (isFullyReturned) {
            order.status = 'returned';
        } else if (isFullyCancelled) {
            order.status = 'cancelled';
        }

        await order.save();
        res.status(200).json({ success: true, message: "Order updated successfully." });

    } catch (error) {
        next(error);
    }
};


export const handleReturnApproval = async (req, res, next) => {
    try {
        const { orderId, itemId, action, comment } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const item = order.items.id(itemId);
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });

        if (action === 'approve') {
            item.status = "Return Approved";
            item.adminComment = comment || "Return request verified.";
        } else if (action === 'reject') {
            item.status = "Return Rejected";
            item.adminComment = comment || "Return policy requirements not met.";
        } else if (action === 'complete') {
            item.status = "Returned";

            await Variant.findOneAndUpdate(
                { _id: item.variantId, "sizes.size": item.size },
                { $inc: { "sizes.$.stock": item.quantity } }
            );
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