import Wishlist from "./wishlist.model.js";
import mongoose from "mongoose";


export const toggleWishlist = async (userId, productId, variantId) => {
    if (!productId) throw new Error("Product ID is required.");

    if (!variantId || variantId === productId) {
        const Product = mongoose.model("Product");
        const productData = await Product.findById(productId);
        const Variant = mongoose.model("Variant");
        const firstVariant = await Variant.findOne({ productId, isDeleted: false });
        variantId = firstVariant?._id || null;
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        wishlist = new Wishlist({
            userId,
            products: [{ productId, variantId: variantId || undefined }],
        });
        await wishlist.save();
        return { action: "added" };
    }

    const targetPid = String(productId);
    const targetVid = variantId ? String(variantId) : null;

    const index = wishlist.products.findIndex((item) => {
        const dbPid = String(item.productId?._id || item.productId);
        const dbVid = item.variantId ? String(item.variantId?._id || item.variantId) : null;
        return dbPid === targetPid && dbVid === targetVid;
    });

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
            select: "name isActive isDeleted description",
        })
        .populate({
            path: "products.variantId",
            select: "images sizes color hex isDeleted",
        });

    if (!wishlist) return [];

    const validItems = wishlist.products.filter(item =>
        item.productId &&
        !item.productId.isDeleted &&
        (!item.variantId || !item.variantId.isDeleted)
    );

    const unique = [];
    const seen = new Set();
    validItems.forEach(item => {
        const vKey = item.variantId?._id || "base";
        const id = `${item.productId._id}-${vKey}`;
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
    const targetVid = variantId ? String(variantId) : null;

    const originalLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(p => {
        const pId = String(p.productId?._id || p.productId);
        const vId = String(p.variantId?._id || p.variantId);
        return !(pId === targetPid && vId === targetVid);
    });

    if (wishlist.products.length !== originalLength) {
        await wishlist.save();
    }
};