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
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;