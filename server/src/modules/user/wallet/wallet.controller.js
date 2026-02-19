import * as walletService from './wallet.service.js';
import crypto from 'crypto';

export const getMyWallet = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const wallet = await walletService.getWalletByUserId(userId);
        res.status(200).json({ success: true, wallet });
    } catch (error) {
        next(error);
    }
};

export const addMoney = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
        const userId = req.user.userId;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            const wallet = await walletService.updateWalletBalance(
                userId,
                Number(amount),
                'credit',
                'Wallet Funding via Razorpay'
            );
            return res.status(200).json({ success: true, message: "Funds added successfully", wallet });
        } else {
            return res.status(400).json({ success: false, message: "Invalid Signature" });
        }
    } catch (error) {
        next(error);
    }
};