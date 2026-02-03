import wishlistModel from "../wishlist/wishlist.model.js";
import * as cartService from "./cart.service.js";

export const getCart = async (req, res) => {
    try {
        const userId = req.user?.userId; 

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication context missing." });
        }

        const cartData = await cartService.getUserCart(userId);

        res.status(200).json({
            success: true,
            ...cartData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { productId, variantId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const cart = await cartService.addItemToCart(userId, req.body);

        if (productId && variantId) {
            await wishlistModel.findOneAndUpdate(
                { userId },
                { $pull: { products: { productId, variantId } } }
            );
        }

        res.status(200).json({
            success: true,
            message: "Archive Synced",
            cart
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const { action } = req.body;
        const { itemId } = req.params;

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication failed." });
        }

        const updatedItem = await cartService.updateItemQuantity(userId, itemId, action);

        res.status(200).json({
            success: true,
            message: "Quantity adjusted",
            item: updatedItem
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication context missing." });
        }

        await cartService.removeItem(userId, itemId);

        res.status(200).json({
            success: true,
            message: "Item purged from archive"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Removal failed"
        });
    }
};

export const clearCart = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Session expired.",
            });
        }

        const cart = await cartService.clearUserCart(userId);

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully.",
            cart,
        });
    } catch (error) {
        console.error("CLEAR_CART_ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to clear cart.",
        });
    }
};


export const validateCartForCheckout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cartData = await cartService.getUserCart(userId);

        const blockedItems = cartData.items.filter(item => !item.isCheckoutReady);

        if (blockedItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Deployment error: Items in your archive have changed status or stock levels.",
                conflicts: blockedItems
            });
        }

        res.status(200).json({
            success: true,
            message: "Manifest verified. Redirecting to terminal."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};