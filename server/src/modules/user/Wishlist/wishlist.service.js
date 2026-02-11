import Wishlist from "./wishlist.model.js"; 

export const toggleWishlist = async (userId, productId, variantId) => {

    if (!productId || !variantId) {
        throw new Error("Archive protocol error: IDs required.");
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        console.log("⚠️ No wishlist found. Creating new one.");
        wishlist = new Wishlist({
            userId,
            products: [{ productId, variantId }],
        });
        await wishlist.save();
        return { action: "added" };
    }

    const targetPid = String(productId);
    const targetVid = String(variantId);

    const index = wishlist.products.findIndex((item) => {
        const dbPid = String(item.productId);
        const dbVid = String(item.variantId);
        
        return dbPid === targetPid && dbVid === targetVid;
    });

    console.log("👉 Match Found at Index:", index);

    if (index > -1) {

        wishlist.products.splice(index, 1);
        await wishlist.save();
        return { action: "removed" };
    } else {

        wishlist.products.push({ productId, variantId });
        await wishlist.save();
        return { action: "added" };
    }
};

export const getUserWishlist = async (userId) => {

    const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: "products.productId",
            select: "name isActive isDeleted description brand thumbnail",
        })
        .populate({
            path: "products.variantId",
            select: "images sizes color hex isDeleted",
        });

    if (!wishlist) return [];

    const validItems = wishlist.products.filter(item => 
        item.productId && item.variantId && 
        !item.productId.isDeleted && !item.variantId.isDeleted
    );

    const unique = [];
    const seen = new Set();

    validItems.forEach(item => {
        const id = `${item.productId._id}-${item.variantId._id}`;
        if (!seen.has(id)) {
            seen.add(id);
            unique.push(item);
        }
    });

    return unique;
};

export const removeFromWishlist = async (userId, productId, variantId) => {
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) return;

    const targetPid = String(productId);
    const targetVid = String(variantId);

    const originalLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(p => {
        const pId = p.productId ? String(p.productId) : "";
        const vId = p.variantId ? String(p.variantId) : "";
        return !(pId === targetPid && vId === targetVid);
    });

    if (wishlist.products.length !== originalLength) {
        await wishlist.save();
    }
};