import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true }, // Store in lowest unit (e.g., paise) or handle decimals carefully
  currency: { type: String, default: "INR" },
  method: { type: String, enum: ["razorpay", "wallet", "cashOnDelivery"], required: true },
  status: {
    type: String,
    enum: ["pending", "success", "failed", "refunded"],
    default: "pending"
  },
  // Razorpay specific fields
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  // Store full provider response for debugging
  rawResponse: { type: Object }
}, { timestamps: true });

// Optional: Indexes for faster queries
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

export default mongoose.model("Payment", paymentSchema);