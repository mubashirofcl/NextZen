import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;
        const options = {
            amount: Math.round(amount * 100), 
            currency,
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Payment init failed" });
    }
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            return res.status(200).json({ success: true, message: "Payment verified" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid Signature" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};