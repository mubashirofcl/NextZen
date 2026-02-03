import wishlistModel from "./wishlist.model.js";
import * as wishlistService from "./wishlist.service.js";

export const handleToggle = async (req, res) => {
    try {
        const { productId, variantId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Session expired.",
            });
        }

        const result = await wishlistService.toggleWishlist(
            userId,
            productId,
            variantId
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
            return res.status(401).json({
                success: false,
                message: "Authentication missing.",
            });
        }

        const products = await wishlistService.getUserWishlist(userId);

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error("GET_WISHLIST_ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch wishlist.",
        });
    }
};


export const clearWishlist = async (req, res) => {
    const userId = req.user?.userId;
    await wishlistModel.findOneAndUpdate({ userId }, { $set: { products: [] } });
    res.status(200).json({ success: true, message: "Archive Purged" });
};