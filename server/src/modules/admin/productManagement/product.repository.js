import mongoose from "mongoose";
import productModel from "./product.model.js";
import Variant from "./variant.model.js";

/* ---------- PRODUCT ---------- */

export const createProductRepo = (data) =>
    productModel.create(data);

export const findProductById = (id) =>
    productModel.findOne({ _id: id, isDeleted: false }).populate("offerId");

export const updateProductById = (id, data) =>
    productModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data }, // 🟢 Uses $set to ensure fields like offerId: null are explicitly saved
        {
            new: true,           // Returns the document AFTER update
            runValidators: true  // Ensures the update follows your Schema rules
        }
    );

export const softDeleteProduct = (id) =>
    productModel.findByIdAndUpdate(id, { isDeleted: true });

/* ---------- VARIANTS ---------- */

export const createVariantsRepo = (variants) =>
    Variant.insertMany(variants);

export const findVariantsByProductId = (productId) =>
    Variant.find({ productId, isDeleted: false });

export const softDeleteVariantsByProductId = async (productId, activeIds = []) => {
    const prodId = new mongoose.Types.ObjectId(productId);
    const keepIds = activeIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

    const result = await Variant.updateMany(
        {
            productId: prodId,
            _id: { $nin: keepIds },
            isDeleted: false
        },
        { $set: { isDeleted: true } }
    );
    return result;
};

/* ---------- ADMIN LISTING PIPELINE ---------- */

export const getAdminProductsRepo = async ({ page, limit, search }) => {
    const skip = (Math.max(page, 1) - 1) * limit;

    const matchStage = {
        isDeleted: false,
        ...(search && {
            name: { $regex: search, $options: "i" },
        }),
    };

    const pipeline = [
        // 1. Initial Match
        { $match: matchStage },

        // 🟢 FIX 1: SORT BY NEWEST FIRST 
        // Ensures latest deployments appear first in Admin and User terminals.
        { $sort: { createdAt: -1 } },

        // 2. Offer Hierarchy Lookups (Product, Sub-Cat, Category, Brand)
        { $lookup: { from: "offers", localField: "offerId", foreignField: "_id", as: "prodOffer" } },
        { $lookup: { from: "categories", localField: "subcategoryId", foreignField: "_id", as: "subDoc" } },
        { $unwind: { path: "$subDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "offers", localField: "subDoc.offerId", foreignField: "_id", as: "subOffer" } },
        { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "catDoc" } },
        { $unwind: { path: "$catDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "offers", localField: "catDoc.offerId", foreignField: "_id", as: "catOffer" } },
        { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brandDoc" } },
        { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "offers", localField: "brandDoc.offerId", foreignField: "_id", as: "brandOffer" } },

        // 3. Resolve the Winning (Highest %) Campaign Offer
        {
            $addFields: {
                winningDiscount: {
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
        },

        // 4. Pull Variants for Stock and Pricing
        {
            $lookup: {
                from: "variants",
                let: { productId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$productId", "$$productId"] }, isDeleted: false } }
                ],
                as: "variantDocs"
            }
        },

        // 5. Calculate Final Display Values
        {
            $addFields: {
                variantCount: { $size: "$variantDocs" },
                totalStock: { $sum: { $map: { input: "$variantDocs", as: "v", in: { $sum: "$$v.sizes.stock" } } } },
                thumbnail: { $arrayElemAt: [{ $arrayElemAt: ["$variantDocs.images", 0] }, 0] },
                minOriginalPrice: { $min: { $map: { input: "$variantDocs", as: "v", in: { $min: "$$v.sizes.originalPrice" } } } },

                finalMinPrice: {
                    $let: {
                        vars: {
                            mrp: { $min: { $map: { input: "$variantDocs", as: "v", in: { $min: "$$v.sizes.originalPrice" } } } },
                            manual: { $min: { $map: { input: "$variantDocs", as: "v", in: { $min: "$$v.sizes.salePrice" } } } },
                            campaign: {
                                $round: [{
                                    $subtract: [
                                        { $min: { $map: { input: "$variantDocs", as: "v", in: { $min: "$$v.sizes.originalPrice" } } } },
                                        { $multiply: [{ $min: { $map: { input: "$variantDocs", as: "v", in: { $min: "$$v.sizes.originalPrice" } } } }, { $divide: ["$winningDiscount", 100] }] }
                                    ]
                                }, 0]
                            }
                        },
                        in: { $min: ["$$manual", "$$campaign"] }
                    }
                }
            }
        },

        // 6. Final Projection
        {
            $project: {
                name: 1,
                isActive: 1,
                variantCount: 1,
                totalStock: 1,
                thumbnail: 1,
                minOriginalPrice: 1,
                minSalePrice: "$finalMinPrice",
                categoryName: "$subDoc.name",
                createdAt: 1,

                // 🟢 FIX 2: STRICT OFFER BADGE LOGIC
                // We map discountValue directly to winningDiscount.
                // This ensures the badge ONLY shows if an additional offer is added.
                // If there's only a manual Sale Price difference, winningDiscount will be 0.
                discountValue: "$winningDiscount"
            }
        },

        // 7. Pagination (Always after sorting)
        { $skip: skip },
        { $limit: limit },
    ];

    const [items, total] = await Promise.all([
        productModel.aggregate(pipeline),
        productModel.countDocuments(matchStage),
    ]);

    return {
        products: items,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
    };
};

export const deactivateProductsByBrand = async (brandId) => {
    return productModel.updateMany(
        { brandId, isDeleted: false },
        { $set: { isActive: false } }
    );
};