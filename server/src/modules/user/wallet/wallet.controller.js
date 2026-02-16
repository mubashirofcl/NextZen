import * as walletService from './wallet.service.js';

export const getMyWallet = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const wallet = await walletService.getWalletByUserId(userId);
        res.status(200).json({ success: true, wallet });
    } catch (error) {
        next(error);
    }
};