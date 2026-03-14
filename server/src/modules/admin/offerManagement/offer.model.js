import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    applyFor: { 
        type: String, 
        enum: ["PRODUCT", "CATEGORY", "SUBCATEGORY", "BRAND"], 
        required: true 
    },
    discountType: { type: String, default: "PERCENT" },
    discountValue: { type: Number, required: true, min: 1, max: 99 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Offer", offerSchema);