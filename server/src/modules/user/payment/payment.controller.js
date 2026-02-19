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
        const { amount, currency = "INR", orderId, isRetry } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            console.error("Payment Error: Invalid amount received", { amount });
            return res.status(400).json({
                success: false,
                message: "A valid numeric amount is required to initialize gateway."
            });
        }

        const options = {
            amount: Math.round(Number(amount) * 100),
            currency,
            receipt: isRetry ? `retry_${orderId?.slice(-6)}` : `rcpt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, order });

    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Payment init failed"
        });
    }
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing verification parameters" });
        }

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
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};