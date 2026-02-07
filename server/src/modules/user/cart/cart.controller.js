import wishlistModel from "../wishlist/wishlist.model.js"; // Note: Capital 'W' to match your image
import Order from "../order/order.model.js"; 
import * as cartRepo from "./cart.repository.js";

// GET // Retrieves the complete cart manifest
export const getCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const cartData = await cartRepo.getUserCart(userId);
        res.status(200).json({ success: true, ...cartData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST // Adds item to archive and removes from wishlist
export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { productId, variantId } = req.body;
        const cart = await cartRepo.addItemToCart(userId, req.body);
        
        if (productId && variantId) {
            await wishlistModel.findOneAndUpdate(
                { userId }, 
                { $pull: { products: { productId, variantId } } }
            );
        }
        res.status(200).json({ success: true, message: "Archive Synced", cart });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// PATCH // Updates item quantity
export const updateQuantity = async (req, res) => {
    try {
        const { action } = req.body;
        const { itemId } = req.params;
        const updatedItem = await cartRepo.updateItemQuantity(req.user.userId, itemId, action);
        res.status(200).json({ success: true, item: updatedItem });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// DELETE // Removes single item
export const removeFromCart = async (req, res) => {
    try {
        await cartRepo.removeItem(req.user.userId, req.params.itemId);
        res.status(200).json({ success: true, message: "Item purged" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// DELETE // Clears entire cart (FIXES SYNTAX ERROR)
export const clearCart = async (req, res) => {
    try {
        await cartRepo.clearUserCart(req.user.userId);
        res.status(200).json({ success: true, message: "Archive cleared" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET // Gatekeeper for checkout validation
export const validateCartForCheckout = async (req, res) => {
    try {
        const cartData = await cartRepo.getUserCart(req.user.userId);

        // Find the first conflict item
        const conflict = cartData.items.find(item => !item.isCheckoutReady);

        if (conflict) {
            // 🛡️ PASS-THROUGH: Send the pre-built error message
            return res.status(400).json({
                success: false,
                message: conflict.errorMessage || "Inventory conflict detected."
            });
        }

        res.status(200).json({ success: true, message: "Manifest verified." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST // Deploys Order (FIXES 400 ERROR)
export const placeOrder = async (req, res) => {
    try {
        const { totals, items, addressId, paymentMethod } = req.body;

        if (!totals || !items || !addressId) {
            return res.status(400).json({ success: false, message: "Manifest data incomplete." });
        }

        const newOrder = new Order({
            userId: req.user.userId,
            items,
            addressId,
            paymentMethod,
            deliveryCharge: totals.deliveryCharge,
            totalMarketPrice: totals.totalMarketPrice,
            totalDiscount: totals.totalDiscount,
            totalAmount: totals.totalAmount,
            status: 'pending'
        });

        await newOrder.save();
        await cartRepo.clearUserCart(req.user.userId); // Wipe archive on success
        
        res.status(201).json({ success: true, orderId: newOrder._id });
    } catch (error) {
        console.error("Deployment Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};