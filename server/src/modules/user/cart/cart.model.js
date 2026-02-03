import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
        size: { type: String, required: true },
        quantity: { type: Number, default: 1, min: 1, max: 5 },
        unitPrice: { type: Number, required: true }
    }]
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);