import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ["SIGNUP", "FORGOT_PASSWORD", "EMAIL_CHANGE"],
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: function() {
                return this.purpose === "EMAIL_CHANGE";
            }
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + 10 * 60 * 1000),
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        attempts: {
            type: Number,
            default: 0,
            max: 5
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });
otpSchema.index({ userId: 1, purpose: 1 });

// Methods
otpSchema.methods.incrementAttempts = async function() {
    this.attempts += 1;
    
    if (this.attempts >= 5) {
        this.isUsed = true;
        await this.save();
        throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
    }
    
    await this.save();
};

otpSchema.statics.cleanupExpired = async function() {
    const now = new Date();
    const result = await this.deleteMany({
        $or: [
            { expiresAt: { $lt: now } },
            { isUsed: true, createdAt: { $lt: new Date(now - 24 * 60 * 60 * 1000) } }
        ]
    });
    return result.deletedCount;
};

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;