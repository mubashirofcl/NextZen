import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    orderNumber: { type: String, unique: true, required: true },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
        default: "pending"
    },
    paymentMethod: { type: String, required: true },
    totalMarketPrice: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["placed", "shipped", "delivered", "cancelled", "return_requested", "returned"],
            default: "placed"
        },
        refundStatus: {
            type: String,
            enum: ["none", "refund_pending", "refund_completed", "refund_failed"],
            default: "none"
        },
        refundAmount: { type: Number, default: 0 },
        reason: { type: String, default: null },
        actionDate: { type: Date, default: null }
    }]
}, { timestamps: true });

orderSchema.pre('save', async function () {
    if (this.items && this.items.length > 0) {
        const allCancelled = this.items.every(item => item.status === 'cancelled');
        if (allCancelled) this.status = 'cancelled';
        
        const allReturned = this.items.every(item => item.status === 'returned');
        if (allReturned) this.status = 'returned';
    }
});

export default mongoose.model("Order", orderSchema);