import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import orderModel from "../order/order.model.js";
import variantModel from "../../admin/productManagement/variant.model.js";
import productModel from "../../admin/productManagement/product.model.js";
import couponModel from "../../admin/couponManagemen/coupon.model.js";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const fixNum = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId, isRetry } = req.body;
        let finalAmount = req.body.amount;

        if (isRetry && orderId) {
            const order = await orderModel.findById(orderId);
            if (!order) return res.status(404).json({ success: false, message: "Order records not found." });

            for (const item of order.items) {
                const variant = await variantModel.findOne({
                    _id: item.variantId,
                    "sizes.size": item.size
                }).populate('productId');

                const sizeData = variant?.sizes.find(s => s.size === item.size);


                if (!variant || variant.isBlocked || variant.productId?.isBlocked) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Product ${item.productId?.name || ''} is no longer available.` 
                    });
                }


                if (!sizeData || sizeData.stock < item.quantity) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Stock mismatch: ${item.size} is now out of stock.` 
                    });
                }
            }

            if (order.couponCode) {
                const coupon = await couponModel.findOne({ code: order.couponCode, isActive: true });
                const now = new Date();
                
                if (!coupon || coupon.endDate < now || coupon.usedCount >= coupon.usageLimit) {
                    order.couponCode = null;
                    order.couponDiscount = 0;
                    order.totalAmount = fixNum(order.subTotal + order.deliveryCharge);
                    await order.save();
                }
            }
            finalAmount = order.totalAmount;
        }

        if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount." });
        }

        const options = {
            amount: Math.round(Number(finalAmount) * 100),
            currency: "INR",
            receipt: isRetry ? `retry_${orderId?.slice(-6)}` : `rcpt_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);
        res.status(200).json({ 
            success: true, 
            order: razorpayOrder, 
            payableAmount: finalAmount 
        });

    } catch (error) {
        console.error("Payment Init Error:", error);
        res.status(500).json({ success: false, message: error.message });
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
            return res.status(200).json({ success: true, message: "Verified" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid Signature" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};