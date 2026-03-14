import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import orderModel from "../order/order.model.js";
import variantModel from "../../admin/productManagement/variant.model.js";
import productModel from "../../admin/productManagement/product.model.js";
import couponModel from "../../admin/couponManagement/coupon.model.js";
import SERVER_MESSAGES from "../../../utils/errorMessages.js";

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
            if (!order) return res.status(SERVER_MESSAGES.CHECKOUT.ORDER_NOT_FOUND.status).json({ success: false, message: SERVER_MESSAGES.CHECKOUT.ORDER_NOT_FOUND.message, code: SERVER_MESSAGES.CHECKOUT.ORDER_NOT_FOUND.code });

            for (const item of order.items) {
                const variant = await variantModel.findOne({
                    _id: item.variantId,
                    "sizes.size": item.size
                }).populate('productId');

                const sizeData = variant?.sizes.find(s => s.size === item.size);


                if (!variant || variant.isBlocked || variant.productId?.isBlocked) {
                    return res.status(SERVER_MESSAGES.PRODUCT.NOT_FOUND.status).json({ 
                        success: false, 
                        message: SERVER_MESSAGES.PRODUCT.NOT_FOUND.message,
                        code: SERVER_MESSAGES.PRODUCT.NOT_FOUND.code
                    });
                }


                if (!sizeData || sizeData.stock < item.quantity) {
                    const stockError = SERVER_MESSAGES.PRODUCT.STOCK_MISMATCH(item.size);
                    return res.status(stockError.status).json({ 
                        success: false, 
                        message: stockError.message,
                        code: stockError.code
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
            return res.status(SERVER_MESSAGES.CHECKOUT.INVALID_AMOUNT.status).json({ success: false, message: SERVER_MESSAGES.CHECKOUT.INVALID_AMOUNT.message, code: SERVER_MESSAGES.CHECKOUT.INVALID_AMOUNT.code });
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
            return res.status(SERVER_MESSAGES.CHECKOUT.PAYMENT_VERIFIED.status).json({ success: true, message: SERVER_MESSAGES.CHECKOUT.PAYMENT_VERIFIED.message });
        } else {
            return res.status(SERVER_MESSAGES.CHECKOUT.INVALID_SIGNATURE.status).json({ success: false, message: SERVER_MESSAGES.CHECKOUT.INVALID_SIGNATURE.message, code: SERVER_MESSAGES.CHECKOUT.INVALID_SIGNATURE.code });
        }
    } catch (error) {
        res.status(SERVER_MESSAGES.SYSTEM.SERVER_ERROR.status).json({ success: false, message: SERVER_MESSAGES.SYSTEM.SERVER_ERROR.message, code: SERVER_MESSAGES.SYSTEM.SERVER_ERROR.code });
    }
};