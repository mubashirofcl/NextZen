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
    const { search = "", page = 1, limit = 10, sort = "", minPrice, maxPrice, isFeatured } = filters;
    const skip = (Number(page) - 1) * Number(limit);
    const pipeline = [];

    const baseMatch = { isActive: true, isDeleted: false };
    if (isFeatured !== undefined) baseMatch.isFeatured = isFeatured;
    pipeline.push({ $match: baseMatch });

    pipeline.push(...lookupOffersHierarchy);

    pipeline.push(
        { $lookup: { from: "variants", localField: "_id", foreignField: "productId", as: "variantDocs" } },
        { $unwind: "$variantDocs" },
        { $match: { "variantDocs.isDeleted": false } },
        { $unwind: "$variantDocs.sizes" }
    );

    pipeline.push({
        $addFields: {
            // STEP 1: Calculate the price if ONLY the campaign offer (e.g. 10%) was applied
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
            // STEP 2: Compare Campaign Price vs Manual Sale Price (17%) and pick the MINIMUM
            calculatedSalePrice: { $min: ["$campaignPrice", "$variantDocs.sizes.salePrice"] }
        }
    });

    pipeline.push({
        $group: {
            _id: "$_id",
            name: { $first: "$name" },
            thumbnail: { $first: { $arrayElemAt: ["$variantDocs.images", 0] } },
            subcategory: { $first: "$subDoc" }, 
            brand: { $first: "$brandDoc" },
            minSalePrice: { $min: "$calculatedSalePrice" },
            minOriginalPrice: { $min: "$variantDocs.sizes.originalPrice" },
            // STEP 3: Back-calculate the discount percentage for the Badge based on final best price
            discountValue: { 
                $first: {
                    $round: [{ 
                        $multiply: [
                            { $divide: [{ $subtract: ["$variantDocs.sizes.originalPrice", "$calculatedSalePrice"] }, "$variantDocs.sizes.originalPrice"] }, 
                            100
                        ] 
                    }, 0]
                }
            },
            totalStock: { $sum: "$variantDocs.sizes.stock" },
            variantCount: { $addToSet: "$variantDocs._id" }
        }
    });

    pipeline.push({
        $facet: {
            data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: Number(limit) }],
            totalCount: [{ $count: "count" }],
        },
    });

    const result = await productModel.aggregate(pipeline);
    return {
        products: (result[0]?.data || []).map(p => ({ ...p, variantCount: p.variantCount?.length || 0 })),
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
    const pipeline = [
        {
            $match: {
                subcategoryId: new mongoose.Types.ObjectId(subcategoryId),
                _id: { $ne: new mongoose.Types.ObjectId(currentProductId) },
                isActive: true, isDeleted: false
            }
        },
        ...lookupOffersHierarchy,
        { $lookup: { from: "variants", localField: "_id", foreignField: "productId", as: "vDocs" } },
        { $unwind: "$vDocs" },
        { $match: { "vDocs.isDeleted": false } },
        {
            $project: {
                _id: 1,
                name: 1,
                thumbnail: { $arrayElemAt: ["$vDocs.images", 0] },
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
                },
                discountValue: {
                    $let: {
                        vars: {
                            bestP: {
                                $min: {
                                    $map: {
                                        input: "$vDocs.sizes",
                                        as: "s",
                                        in: {
                                            $let: {
                                                vars: {
                                                    cPrice: { $cond: [{ $gt: ["$winningOffer.maxDiscount", 0] }, { $round: [{ $subtract: ["$$s.originalPrice", { $multiply: ["$$s.originalPrice", { $divide: ["$winningOffer.maxDiscount", 100] }] }] }, 0] }, "$$s.originalPrice"] }
                                                },
                                                in: { $min: ["$$cPrice", "$$s.salePrice"] }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        in: { $round: [{ $multiply: [{ $divide: [{ $subtract: [{ $min: "$vDocs.sizes.originalPrice" }, "$$bestP"] }, { $min: "$vDocs.sizes.originalPrice" }] }, 100] }, 0] }
                    }
                }
            }
        },
        { $limit: 20 }
    ];
    return await Product.aggregate(pipeline);
};