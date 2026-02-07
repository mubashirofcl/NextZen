import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order", 
    required: true 
  },
  method: { 
    type: String, 
    enum: ["razorpay", "wallet", "cashOnDelivery"], 
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["success", "failed", "pending"], 
    default: "pending" 
  },
  gatewayPaymentId: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("PaymentTransaction", paymentSchema);