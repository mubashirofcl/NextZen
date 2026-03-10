import mongoose from "mongoose";
import Product from "../../admin/productManagement/product.model.js";
import productModel from "../../admin/productManagement/product.model.js";

const lookupOffersHierarchy = [
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
    {
        $addFields: {
            winningOffer: {
                $let: {
                    vars: {
                        p: { $arrayElemAt: ["$prodOffer", 0] },
                        s: { $arrayElemAt: ["$subOffer", 0] },
                        c: { $arrayElemAt: ["$catOffer", 0] },
                        b: { $arrayElemAt: ["$brandOffer", 0] },
                        now: new Date()
                    },
                    in: {
                        $let: {
                            vars: {
                                pVal: { $cond: [{ $and: ["$$p.isActive", { $lte: ["$$p.startDate", "$$now"] }, { $gte: ["$$p.endDate", "$$now"] }] }, "$$p.discountValue", 0] },
                                sVal: { $cond: [{ $and: ["$$s.isActive", { $lte: ["$$s.startDate", "$$now"] }, { $gte: ["$$s.endDate", "$$now"] }] }, "$$s.discountValue", 0] },
                                cVal: { $cond: [{ $and: ["$$c.isActive", { $lte: ["$$c.startDate", "$$now"] }, { $gte: ["$$c.endDate", "$$now"] }] }, "$$c.discountValue", 0] },
                                bVal: { $cond: [{ $and: ["$$b.isActive", { $lte: ["$$b.startDate", "$$now"] }, { $gte: ["$$b.endDate", "$$now"] }] }, "$$b.discountValue", 0] }
                            },
                            in: { maxDiscount: { $max: ["$$pVal", "$$sVal", "$$cVal", "$$bVal"] } }
                        }
                    }
                }
            }
        }
    }
];

export const getProductsRepository = async (filters) => {
    const {
        search = "",
        page = 1,
        limit = 10,
        sort = "",
        category,
        subcategory,
        brand,
        size,
        minPrice,
        maxPrice,
        isFeatured
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const pipeline = [];

    // 1. Initial Match
    const baseMatch = { isActive: true, isDeleted: false };
    if (isFeatured !== undefined) baseMatch.isFeatured = isFeatured;
    if (category && mongoose.Types.ObjectId.isValid(category)) baseMatch.categoryId = new mongoose.Types.ObjectId(category);
    if (subcategory && mongoose.Types.ObjectId.isValid(subcategory)) baseMatch.subcategoryId = new mongoose.Types.ObjectId(subcategory);

    pipeline.push({ $match: baseMatch });

    // 2. JOIN CATEGORIES EARLY (Required for Name Search and UI Display)
    pipeline.push({
        $lookup: {
            from: "categories",
            localField: "subcategoryId",
            foreignField: "_id",
            as: "subcategoryInfo"
        }
    });

    // 3. APPLY MULTI-FIELD SEARCH
    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { "subcategoryInfo.name": { $regex: search, $options: "i" } }
                ]
            }
        });
    }

    // 4. Offer & Brand Lookup Hierarchy
    pipeline.push(...lookupOffersHierarchy);

    // 5. Variant & Size Unwinding
    pipeline.push(
        { $lookup: { from: "variants", localField: "_id", foreignField: "productId", as: "variantDocs" } },
        { $unwind: "$variantDocs" },
        { $match: { "variantDocs.isDeleted": false } },
        { $unwind: "$variantDocs.sizes" }
    );

    // Filter Brands & Sizes
    if (brand && brand.length > 0) {
        const brandIds = Array.isArray(brand) ? brand : brand.split(",");
        pipeline.push({ $match: { brandId: { $in: brandIds.map(id => new mongoose.Types.ObjectId(id)) } } });
    }
    if (size && size.length > 0) {
        const sizeList = Array.isArray(size) ? size : size.split(",");
        pipeline.push({ $match: { "variantDocs.sizes.size": { $in: sizeList } } });
    }

    // 6. Price Calculations
    pipeline.push({
        $addFields: {
            campaignPrice: {
                $cond: [
                    { $gt: [{ $toDouble: "$winningOffer.maxDiscount" }, 0] },
                    { $round: [{ $subtract: ["$variantDocs.sizes.originalPrice", { $multiply: ["$variantDocs.sizes.originalPrice", { $divide: [{ $toDouble: "$winningOffer.maxDiscount" }, 100] }] }] }, 0] },
                    "$variantDocs.sizes.originalPrice"
                ]
            }
        }
    });

    pipeline.push({
        $addFields: {
            calculatedSalePrice: { $min: ["$campaignPrice", "$variantDocs.sizes.salePrice"] }
        }
    });

    // 7. FINAL GROUPING (Fixed for Header UI)
    pipeline.push({
        $group: {
            _id: "$_id",
            name: { $first: "$name" },
            thumbnail: { $first: { $arrayElemAt: ["$variantDocs.images", 0] } },
            subcategory: { $first: { $arrayElemAt: ["$subcategoryInfo", 0] } },
            brand: { $first: "$brandDoc" },
            minSalePrice: { $min: "$calculatedSalePrice" },
            minOriginalPrice: { $min: "$variantDocs.sizes.originalPrice" },
            discountValue: {
                $first: {
                    $round: [{
                        $multiply: [
                            { $divide: [{ $subtract: ["$variantDocs.sizes.originalPrice", "$calculatedSalePrice"] }, "$variantDocs.sizes.originalPrice"] },
                            100
                        ]
                    }, 0]
                }
            }
        }
    });

    // Sorting & Facet
    let sortObj = { createdAt: -1 };
    if (sort === "price_asc") sortObj = { minSalePrice: 1 };
    else if (sort === "price_desc") sortObj = { minSalePrice: -1 };

    pipeline.push({ $sort: sortObj });

    pipeline.push({
        $facet: {
            data: [{ $skip: skip }, { $limit: Number(limit) }],
            totalCount: [{ $count: "count" }],
        },
    });

    const result = await productModel.aggregate(pipeline);

    return {
        products: (result[0]?.data || []),
        totalCount: result[0]?.totalCount[0]?.count || 0
    };
};

export const getProductByIdRepository = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id), isActive: true, isDeleted: false } },
        ...lookupOffersHierarchy,
        { $lookup: { from: "variants", localField: "_id", foreignField: "productId", as: "variants" } },
        {
            $addFields: {
                brand: "$brandDoc",
                subcategory: "$subDoc",
                variants: {
                    $map: {
                        input: { $filter: { input: "$variants", as: "v", cond: { $eq: ["$$v.isDeleted", false] } } },
                        as: "v",
                        in: {
                            $mergeObjects: [
                                "$$v",
                                {
                                    sizes: {
                                        $map: {
                                            input: "$$v.sizes",
                                            as: "s",
                                            in: {
                                                $let: {
                                                    vars: {
                                                        cPrice: {
                                                            $cond: [
                                                                { $gt: ["$winningOffer.maxDiscount", 0] },
                                                                { $round: [{ $subtract: ["$$s.originalPrice", { $multiply: ["$$s.originalPrice", { $divide: ["$winningOffer.maxDiscount", 100] }] }] }, 0] },
                                                                "$$s.originalPrice"
                                                            ]
                                                        }
                                                    },
                                                    in: {
                                                        $mergeObjects: [
                                                            "$$s",
                                                            {
                                                                salePrice: { $min: ["$$cPrice", "$$s.salePrice"] },
                                                                appliedDiscount: {
                                                                    $round: [{
                                                                        $multiply: [
                                                                            { $divide: [{ $subtract: ["$$s.originalPrice", { $min: ["$$cPrice", "$$s.salePrice"] }] }, "$$s.originalPrice"] },
                                                                            100
                                                                        ]
                                                                    }, 0]
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }
    ];

    const result = await productModel.aggregate(pipeline);
    return result.length > 0 ? result[0] : null;
};

export const getRecommendedProducts = async (subcategoryId, currentProductId) => {
    const currentProd = await productModel.findById(currentProductId);
    const parentCatId = currentProd?.categoryId;

    const pipeline = [
        {
            $match: {
                _id: { $ne: new mongoose.Types.ObjectId(currentProductId) },
                isActive: true,
                isDeleted: false,
                $or: [
                    { subcategoryId: new mongoose.Types.ObjectId(subcategoryId) },
                    { categoryId: parentCatId }
                ]
            }
        },
        ...lookupOffersHierarchy,
        { $lookup: { from: "variants", localField: "_id", foreignField: "productId", as: "vDocs" } },
        { $unwind: { path: "$vDocs", preserveNullAndEmptyArrays: true } },
        { $match: { "vDocs.isDeleted": false } },
        {
            $project: {
                _id: 1,
                name: 1,
                thumbnail: { $arrayElemAt: ["$vDocs.images", 0] },
                hex: "$vDocs.hex",
                color: "$vDocs.color",
                minSalePrice: {
                    $let: {
                        vars: {
                            bestPrices: {
                                $map: {
                                    input: "$vDocs.sizes",
                                    as: "s",
                                    in: {
                                        $let: {
                                            vars: {
                                                cPrice: {
                                                    $cond: [
                                                        { $gt: ["$winningOffer.maxDiscount", 0] },
                                                        { $round: [{ $subtract: ["$$s.originalPrice", { $multiply: ["$$s.originalPrice", { $divide: ["$winningOffer.maxDiscount", 100] }] }] }, 0] },
                                                        "$$s.originalPrice"
                                                    ]
                                                }
                                            },
                                            in: { $min: ["$$cPrice", "$$s.salePrice"] }
                                        }
                                    }
                                }
                            }
                        },
                        in: { $min: "$$bestPrices" }
                    }
                }
            }
        },
        { $limit: 10 }
    ];

    return await productModel.aggregate(pipeline);
};