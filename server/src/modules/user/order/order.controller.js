export const prepareCheckout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cart = await cartService.getUserCart(userId);

        if (!cart.items.length) {
            return res.status(400).json({ success: false, message: "Archive is empty." });
        }

        // Verify all items are available before allowing checkout
        const hasUnavailable = cart.items.some(i => !i.isAvailable);
        if (hasUnavailable) {
            return res.status(400).json({ success: false, message: "Please remove unavailable items." });
        }

        res.status(200).json({ 
            success: true, 
            checkoutData: cart 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};