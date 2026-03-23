import wishlistModel from "./wishlist.model.js";
import * as wishlistService from "./wishlist.service.js";
import SERVER_MESSAGES from "../../../utils/errorMessages.js";

export const handleToggle = async (req, res) => {
    try {
        const { productId, variantId, size } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(SERVER_MESSAGES.AUTH.SESSION_EXPIRED.status).json({
                success: false,
                message: SERVER_MESSAGES.AUTH.SESSION_EXPIRED.message,
                code: SERVER_MESSAGES.AUTH.SESSION_EXPIRED.code
            });
        }

        const result = await wishlistService.toggleWishlist(
            userId,
            productId,
            variantId,
            size
        );

        res.status(200).json({
            success: true,
            action: result.action,
        });
    } catch (error) {
        console.error("WISHLIST_TOGGLE_ERROR:", error.message);
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(SERVER_MESSAGES.AUTH.ACCESS_DENIED.status).json({
                success: false,
                message: SERVER_MESSAGES.AUTH.ACCESS_DENIED.message,
                code: SERVER_MESSAGES.AUTH.ACCESS_DENIED.code
            });
        }

        const products = await wishlistService.getUserWishlist(userId);

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error("GET_WISHLIST_ERROR:", error.message);
        res.status(SERVER_MESSAGES.CART_WISHLIST.FETCH_FAILED.status).json({
            success: false,
            message: SERVER_MESSAGES.CART_WISHLIST.FETCH_FAILED.message,
            code: SERVER_MESSAGES.CART_WISHLIST.FETCH_FAILED.code
        });
    }
};


export const clearWishlist = async (req, res) => {
    const userId = req.user?.userId;
    await wishlistModel.findOneAndUpdate({ userId }, { $set: { products: [] } });
    res.status(SERVER_MESSAGES.CART_WISHLIST.PURGED.status).json({ success: true, message: SERVER_MESSAGES.CART_WISHLIST.PURGED.message });
};

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId, variantId, size } = req.body;
        const userId = req.user?.userId;

        await wishlistService.removeFromWishlist(userId, productId, variantId, size);

        res.status(SERVER_MESSAGES.CART_WISHLIST.REMOVED.status).json({ success: true, message: SERVER_MESSAGES.CART_WISHLIST.REMOVED.message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};