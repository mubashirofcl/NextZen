import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    orderNumber: { type: String, unique: true, required: true },
    razorpayOrderId: { type: String },

    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "payment_failed"],
        default: "pending"
    },

    paymentMethod: { type: String, required: true },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Refunded", "Failed", "Cancelled"],
        default: "Pending"
    },

    subTotal: { type: Number, required: true, default: 0 },
    totalDiscount: { type: Number, required: true, default: 0 },
    couponCode: { type: String, default: null },
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },

    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true },
        originalPrice: { type: Number, default: 0 },
        price: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["Placed", "Shipped", "Delivered", "Cancelled", "Return Requested", "Return Approved", "Return Rejected", "Returned"],
            default: "Placed"
        },
        returnReason: String,
        adminComment: String,
        requestDate: Date,
        actionDate: Date
    }]
}, { timestamps: true });

orderSchema.pre('save', function () {
    if (this.status === 'payment_failed') {
        this.paymentStatus = 'Failed';
        return;
    }

    if (this.items && this.items.length > 0) {
        const activeItems = this.items.filter(item => item.status !== 'Cancelled');
        const allActiveDelivered = activeItems.length > 0 && activeItems.every(item => item.status === 'Delivered');

        if (allActiveDelivered && this.status !== 'delivered') {
            this.status = 'delivered';
        }

        if (this.status === 'delivered' &&
            ['COD', 'cashOnDelivery'].includes(this.paymentMethod) &&
            this.paymentStatus === 'Pending') {
            this.paymentStatus = 'Paid';
        }
    }
});

export default mongoose.model("Order", orderSchema);