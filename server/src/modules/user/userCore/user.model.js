import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            default: null,
            sparse: true,
        },
        profilePicture: {
            type: String,
            default: null,
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
            select: false
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        referralCode: {
            type: String,
            unique: true,
            sparse: true
        },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        referralCount: {
            type: Number,
            default: 0
        },
        pendingEmailUpdate: { type: String, default: null },
        pendingProfileData: { type: Object, default: null },
        blockReason: { type: String },
        blockedAt: { type: Date },
        refreshToken: {
            type: String,
            select: false 
        },
    },
    {
        timestamps: true,
    }
);

userSchema.virtual('walletData', {
    ref: 'Wallet',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

userSchema.pre('save', function () {
    if (!this.referralCode) {
        this.referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    }
});
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;