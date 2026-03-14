import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['PERCENT', 'FLAT'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    maxDiscount: {
        type: Number,
        default: null
    },
    minPurchaseAmt: {
        type: Number,
        default: 0
    },
    usageLimit: {
        type: Number,
        required: true
    },
    usagePerUser: {
        type: Number,
        default: 1
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usedCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

couponSchema.pre('save', function () {
    if (this.isModified('code') && this.code) {
        this.code = this.code.toUpperCase();
    }
});

export default mongoose.model("Coupon", couponSchema);