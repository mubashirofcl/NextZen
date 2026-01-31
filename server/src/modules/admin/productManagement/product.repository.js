import mongoose from "mongoose";
import productModel from "./product.model.js";
import Variant from "./variant.model.js";

/* ---------- PRODUCT ---------- */

export const createProductRepo = (data) =>
    productModel.create([data]);

export const findProductById = (id) =>
    productModel.findOne({ _id: id, isDeleted: false });

export const updateProductById = (id, data) =>
    productModel.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });

export const softDeleteProduct = (id) =>
    productModel.findByIdAndUpdate(id, { isDeleted: true });

/* ---------- VARIANTS ---------- */

export const createVariantsRepo = (variants) =>
    Variant.insertMany(variants);

export const findVariantsByProductId = (productId) =>
    Variant.find({ productId, isDeleted: false });

export const softDeleteVariantsByProductId = async (productId, activeIds = []) => {
    // 1. Force the cast and LOG it to be sure
    const prodId = new mongoose.Types.ObjectId(productId);

    // 2. Ensure all active IDs are ObjectIds
    const keepIds = activeIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

    console.log("--- REPO EXECUTION ---");
    console.log("Searching for productId:", prodId);
    console.log("Excluding variant IDs:", keepIds);

    // 3. The Query
    const result = await Variant.updateMany(
        {
            productId: prodId,         // Must match exactly
            _id: { $nin: keepIds },    // Must be array of ObjectIds
            isDeleted: false           // Only target active ones
        },
        { $set: { isDeleted: true } }
    );

    console.log(`[DELETE DEBUG] Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
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

        {
            $lookup: {
                from: "variants",
                let: { productId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$productId", "$$productId"] },
                            isDeleted: false,
                        },
                    },
                ],
                as: "variants",
            },
        },

        {
            $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category",
            },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

        {
            $addFields: {
                variantCount: { $size: "$variants" },

                totalStock: {
                    $sum: {
                        $map: {
                            input: "$variants",
                            as: "v",
                            in: { $sum: "$$v.sizes.stock" },
                        },
                    },
                },

                minSalePrice: {
                    $min: {
                        $map: {
                            input: "$variants",
                            as: "v",
                            in: { $min: "$$v.sizes.salePrice" },
                        },
                    },
                },

                minOriginalPrice: {
                    $min: {
                        $map: {
                            input: "$variants",
                            as: "v",
                            in: { $min: "$$v.sizes.originalPrice" },
                        },
                    },
                },

                thumbnail: {
                    $arrayElemAt: [
                        {
                            $map: {
                                input: "$variants",
                                as: "v",
                                in: { $arrayElemAt: ["$$v.images", 0] },
                            },
                        },
                        0,
                    ],
                },
            },
        },

        {
            $project: {
                name: 1,
                isActive: 1,
                createdAt: 1,
                variantCount: 1,
                totalStock: 1,
                minSalePrice: 1,
                minOriginalPrice: 1,
                thumbnail: 1,
                category: { name: 1 },
            },
        },

        { $sort: { createdAt: -1 } },
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
        {
            brandId,
            isDeleted: false,
        },
        {
            $set: { isActive: false },
        }
    );
};