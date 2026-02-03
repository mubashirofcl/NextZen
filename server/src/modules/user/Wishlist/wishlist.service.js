import Wishlist from "./wishlist.model.js";

export const toggleWishlist = async (userId, productId, variantId) => {
    if (!productId || !variantId) {
        throw new Error("Archive protocol error: IDs required.");
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = new Wishlist({
            userId,
            products: [{ productId, variantId }],
        });
        await wishlist.save();
        return { action: "added" };
    }

    const index = wishlist.products.findIndex(
        (p) => p.productId?.toString() === productId.toString() &&
               p.variantId?.toString() === variantId.toString()
    );

    if (index > -1) {
        wishlist.products.splice(index, 1);
    } else {
        wishlist.products.push({ productId, variantId });
    }

    await wishlist.save();
    return { action: index > -1 ? "removed" : "added" };
};

export const getUserWishlist = async (userId) => {
    const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: "products.productId",
            select: "name isActive isDeleted",
        })
        .populate({
            path: "products.variantId",
            select: "images sizes color hex isDeleted",
        });

    if (!wishlist) return [];

    const unique = [];
    const seen = new Set();

    wishlist.products.forEach(item => {
        if (item.productId && item.variantId) {
            const id = `${item.productId._id}-${item.variantId._id}`;
            if (!seen.has(id)) {
                seen.add(id);
                unique.push(item);
            }
        }
    });

    return unique;
};