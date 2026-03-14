import wishlistModel from "../Wishlist/wishlist.model.js";
import Order from "../order/order.model.js"; 
import * as cartRepo from "./cart.repository.js";

export const getCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const cartData = await cartRepo.getUserCart(userId);
        res.status(200).json({ success: true, ...cartData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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

export const removeFromCart = async (req, res) => {
    try {
        await cartRepo.removeItem(req.user.userId, req.params.itemId);
        res.status(200).json({ success: true, message: "Item purged" });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        await cartRepo.clearUserCart(req.user.userId);
        res.status(200).json({ success: true, message: "Archive cleared" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const validateCartForCheckout = async (req, res) => {
    try {
        const cartData = await cartRepo.getUserCart(req.user.userId);

        const conflict = cartData.items.find(item => !item.isCheckoutReady);

        if (conflict) {
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
export const placeOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { addressId, paymentMethod } = req.body;

        const cartData = await cartRepo.getUserCart(userId);

        if (!cartData || cartData.items.length === 0) {
            return res.status(400).json({ success: false, message: "Archive empty. Order aborted." });
        }

        const conflict = cartData.items.find(item => !item.isCheckoutReady);
        if (conflict) {
            return res.status(400).json({ success: false, message: conflict.errorMessage });
        }

        const subtotal = cartData.subtotal;
        const deliveryCharge = (subtotal < 1999 && subtotal > 0) ? 99 : 0;
        const finalTotal = subtotal + deliveryCharge;

        const orderItems = cartData.items.map(item => ({
            productId: item.productId._id,
            variantId: item.variantId._id,
            size: item.size,
            quantity: item.quantity,
            price: item.currentPrice,
            totalAmount: item.currentPrice * item.quantity 
        }));

        const newOrder = new Order({
            userId,
            addressId,
            paymentMethod,
            items: orderItems,
            subTotal: subtotal,
            totalMarketPrice: cartData.totalMarketPrice,
            totalDiscount: cartData.totalDiscount,
            deliveryCharge,
            totalAmount: finalTotal, 
            status: 'pending'
        });

        await newOrder.save();
        
        await cartRepo.clearUserCart(userId); 
        
        res.status(201).json({ success: true, orderId: newOrder._id });
    } catch (error) {
        console.error("Order Deployment Failed:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};