import mongoose from "mongoose";

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
        pendingEmailUpdate: {
            type: String,
            default: null
        },
        pendingProfileData: {
            type: Object,
            default: null
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        blockReason: {
            type: String
        },
        blockedAt: {
            type: Date
        },
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
    ref: 'Wallet',           // The name of your Wallet model
    localField: '_id',       // The user ID stored in User model
    foreignField: 'userId',  // The field in Wallet model that stores the User ID
    justOne: true            // A user only has one wallet
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;