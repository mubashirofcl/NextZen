import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["razorpay", "wallet", "cashOnDelivery"], required: true },
  status: {
    type: String,
    enum: ["pending", "success", "failed", "refunded"],
    default: "pending"
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  rawResponse: { type: Object }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);