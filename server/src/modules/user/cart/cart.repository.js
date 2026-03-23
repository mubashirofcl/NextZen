import Cart from "./cart.model.js";
import Variant from "../../admin/productManagement/variant.model.js";
import mongoose from "mongoose";

export const addItemToCart = async (userId, { productId, variantId, size, quantity = 1 }) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const itemIndex = cart.items.findIndex(item =>
        item.variantId.toString() === variantId.toString() &&
        item.size === size
    );

    if (itemIndex > -1) {
        const newQty = cart.items[itemIndex].quantity + Number(quantity);
        if (newQty > 5) throw new Error("Maximum 5 units allowed per item.");
        cart.items[itemIndex].quantity = newQty;
    } else {
        const variant = await Variant.findById(variantId);
        const sizeData = variant?.sizes.find(s => s.size === size);
        if (!sizeData || sizeData.stock < 1) throw new Error("Size out of stock.");

        cart.items.push({
            productId,
            variantId,
            size,
            quantity,
            unitPrice: sizeData.salePrice
        });
    }
    return await cart.save();
};

const lookupOffersHierarchy = [
    { $lookup: { from: "offers", localField: "items.productId", foreignField: "_id", as: "prodOffer" } },
    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "productBase" } },
    { $unwind: { path: "$productBase", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "categories", localField: "productBase.subcategoryId", foreignField: "_id", as: "subDoc" } },
    { $unwind: { path: "$subDoc", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "offers", localField: "subDoc.offerId", foreignField: "_id", as: "subOffer" } },
    { $lookup: { from: "categories", localField: "productBase.categoryId", foreignField: "_id", as: "catDoc" } },
    { $unwind: { path: "$catDoc", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "offers", localField: "catDoc.offerId", foreignField: "_id", as: "catOffer" } },
    { $lookup: { from: "brands", localField: "productBase.brandId", foreignField: "_id", as: "brandDoc" } },
    { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "offers", localField: "brandDoc.offerId", foreignField: "_id", as: "brandOffer" } },
    {
        $addFields: {
            "items.bestDiscount": {
                $let: {
                    vars: {
                        p: { $arrayElemAt: ["$prodOffer", 0] },
                        s: { $arrayElemAt: ["$subOffer", 0] },
                        c: { $arrayElemAt: ["$catOffer", 0] },
                        b: { $arrayElemAt: ["$brandOffer", 0] },
                        now: new Date()
                    },
                    in: {
                        $max: [
                            { $cond: [{ $and: ["$$p.isActive", { $lte: ["$$p.startDate", "$$now"] }, { $gte: ["$$p.endDate", "$$now"] }] }, "$$p.discountValue", 0] },
                            { $cond: [{ $and: ["$$s.isActive", { $lte: ["$$s.startDate", "$$now"] }, { $gte: ["$$s.endDate", "$$now"] }] }, "$$s.discountValue", 0] },
                            { $cond: [{ $and: ["$$c.isActive", { $lte: ["$$c.startDate", "$$now"] }, { $gte: ["$$c.endDate", "$$now"] }] }, "$$c.discountValue", 0] },
                            { $cond: [{ $and: ["$$b.isActive", { $lte: ["$$b.startDate", "$$now"] }, { $gte: ["$$b.endDate", "$$now"] }] }, "$$b.discountValue", 0] }
                        ]
                    }
                }
            }
        }
    }
];

export const getUserCart = async (userId) => {
    const pipeline = [
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: "$items" },

        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "productBase"
            }
        },
        { $unwind: "$productBase" },

        { $lookup: { from: "offers", localField: "productBase.offerId", foreignField: "_id", as: "pOffer" } },

        { $lookup: { from: "categories", localField: "productBase.subcategoryId", foreignField: "_id", as: "subDoc" } },
        { $unwind: { path: "$subDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "offers", localField: "subDoc.offerId", foreignField: "_id", as: "sOffer" } },

        { $lookup: { from: "categories", localField: "productBase.categoryId", foreignField: "_id", as: "catDoc" } },
        { $unwind: { path: "$catDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "offers", localField: "catDoc.offerId", foreignField: "_id", as: "cOffer" } },

        { $lookup: { from: "brands", localField: "productBase.brandId", foreignField: "_id", as: "brandDoc" } },
        { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "offers", localField: "brandDoc.offerId", foreignField: "_id", as: "bOffer" } },

        {

            $addFields: {
                "items.bestDiscount": {
                    $let: {
                        vars: {
                            p: { $arrayElemAt: ["$pOffer", 0] },
                            s: { $arrayElemAt: ["$sOffer", 0] },
                            c: { $arrayElemAt: ["$cOffer", 0] },
                            b: { $arrayElemAt: ["$bOffer", 0] },
                            now: new Date()
                        },
                        in: {
                            $max: [
                                { $cond: [{ $and: ["$$p.isActive", { $lte: ["$$p.startDate", "$$now"] }, { $gte: ["$$p.endDate", "$$now"] }] }, "$$p.discountValue", 0] },
                                { $cond: [{ $and: ["$$s.isActive", { $lte: ["$$s.startDate", "$$now"] }, { $gte: ["$$s.endDate", "$$now"] }] }, "$$s.discountValue", 0] },
                                { $cond: [{ $and: ["$$c.isActive", { $lte: ["$$c.startDate", "$$now"] }, { $gte: ["$$c.endDate", "$$now"] }] }, "$$c.discountValue", 0] },
                                { $cond: [{ $and: ["$$b.isActive", { $lte: ["$$b.startDate", "$$now"] }, { $gte: ["$$b.endDate", "$$now"] }] }, "$$b.discountValue", 0] }
                            ]
                        }
                    }
                }
            }
        },

        { $lookup: { from: "variants", localField: "items.variantId", foreignField: "_id", as: "vDetail" } },
        { $unwind: "$vDetail" },

        {
            $addFields: {
                "items.productId": "$productBase",
                "items.variantId": "$vDetail",
                "items.resolvedPrices": {
                    $let: {
                        vars: {
                            sizeData: { $arrayElemAt: [{ $filter: { input: "$vDetail.sizes", as: "sz", cond: { $eq: ["$$sz.size", "$items.size"] } } }, 0] },
                            disc: "$items.bestDiscount"
                        },
                        in: {
                            mrp: "$$sizeData.originalPrice",
                            manual: "$$sizeData.salePrice",
                            campaign: {
                                $round: [{
                                    $subtract: [
                                        "$$sizeData.originalPrice",
                                        { $multiply: ["$$sizeData.originalPrice", { $divide: ["$$disc", 100] }] }
                                    ]
                                }, 0]
                            }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                "items.currentPrice": { $min: ["$items.resolvedPrices.manual", "$items.resolvedPrices.campaign"] },
                "items.marketPrice": "$items.resolvedPrices.mrp"
            }
        },
        {
            $group: {
                _id: "$_id",
                items: { $push: "$items" }
            }
        }
    ];

    const result = await Cart.aggregate(pipeline);
    const cart = result[0];

    if (!cart) return { items: [], subtotal: 0, totalMarketPrice: 0, totalDiscount: 0 };

    const processedItems = cart.items.map(item => {
        const product = item.productId;
        const variant = item.variantId;
        const sizeData = variant?.sizes?.find(s => s.size === item.size);
        const stockAvailable = sizeData?.stock || 0;

        const isLive = !!(product && product.isActive && !product.isDeleted && !variant.isDeleted);
        const hasStock = stockAvailable >= item.quantity;

        return {
            ...item,
            isCheckoutReady: isLive && hasStock,
            priceDropped: item.currentPrice < item.unitPrice,
            errorMessage: !isLive ? "Item no longer available." : !hasStock ? "Out of Stock." : null
        };
    });

    const subtotal = processedItems.reduce((acc, i) => i.isCheckoutReady ? acc + (i.currentPrice * i.quantity) : acc, 0);
    const totalMarketPrice = processedItems.reduce((acc, i) => i.isCheckoutReady ? acc + (i.marketPrice * i.quantity) : acc, 0);

    return { items: processedItems, subtotal, totalMarketPrice, totalDiscount: totalMarketPrice - subtotal };
};

export const updateItemQuantity = async (userId, itemId, action) => {
    const cart = await Cart.findOne({ userId });
    const item = cart.items.id(itemId);
    const variant = await Variant.findById(item.variantId);
    const sizeData = variant?.sizes.find(s => s.size === item.size);

    if (action === 'inc') {
        if (item.quantity >= 5) throw new Error("Maximum limit reached (5).");
        if (item.quantity >= (sizeData?.stock || 0)) throw new Error("Stock depleted.");
        item.quantity += 1;
    } else {
        if (item.quantity > 1) item.quantity -= 1;
    }
    return await cart.save();
};

export const removeItem = async (userId, itemId) => {
    return await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { _id: itemId } } },
        { new: true }
    );
};

export const clearUserCart = async (userId) => {
    return await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [] } },
        { new: true }
    );
};