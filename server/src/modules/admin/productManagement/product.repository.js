import mongoose from "mongoose";
import productModel from "./product.model.js";
import Variant from "./variant.model.js";

export const createProductRepo = (data) =>
    productModel.create(data);

export const findProductById = (id) =>
    productModel.findOne({ _id: id, isDeleted: false }).populate("offerId");

export const updateProductById = (id, data) =>
    productModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: data },
        {
            new: true,
            runValidators: true
        }
    );

export const softDeleteProduct = (id) =>
    productModel.findByIdAndUpdate(id, { isDeleted: true });


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



export const getAdminProductsRepo = async ({ page, limit, search }) => {
    const skip = (Math.max(page, 1) - 1) * limit;

    const matchStage = {
        isDeleted: false,
        ...(search && {
            name: { $regex: search, $options: "i" },
        }),
    };

    const pipeline = [

        { $match: matchStage },
        { $sort: { createdAt: -1 } },
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

                discountValue: "$winningDiscount"
            }
        },

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
    return await productModel.updateMany(
        { brandId: brandId },
        { $set: { isActive: false } }
    );
};

export const activateProductsByBrand = async (brandId) => {
    return await productModel.updateMany(
        { brandId: brandId },
        { $set: { isActive: true } }
    );
};

export const updateProductsStatusByCategory = async (categoryIds, isActive, { session } = {}) => {
    const idArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];

    const filter = {
        $or: [
            { categoryId: { $in: idArray } }, 
            { subCategoryId: { $in: idArray } }, 
            { subcategoryId: { $in: idArray } }  
        ]
    };

    return await productModel.updateMany(
        filter,
        { $set: { isActive } },
        { session }
    );
};