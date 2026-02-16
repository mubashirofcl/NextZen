import mongoose from "mongoose";
import Product from "../../admin/productManagement/product.model.js";
import productModel from "../../admin/productManagement/product.model.js";

export const getProductsRepository = async (filters) => {
    const {
        search = "",
        page = 1,
        limit = 10,
        sort = "",
        category,
        subcategory,
        size,
        brand,
        minPrice,
        maxPrice,
        isFeatured,
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const pipeline = [];

    // 1. Initial Filtering (Basic Product Status)
    const baseMatch = { isActive: true, isDeleted: false };
    if (isFeatured !== undefined) baseMatch.isFeatured = isFeatured;

    if (subcategory && mongoose.Types.ObjectId.isValid(subcategory)) {
        baseMatch.subcategoryId = new mongoose.Types.ObjectId(subcategory);
    } else if (category && mongoose.Types.ObjectId.isValid(category)) {
        baseMatch.categoryId = new mongoose.Types.ObjectId(category);
    }

    if (brand) {
        let brandIds = Array.isArray(brand) ? brand : brand.split(",").filter(id => id.trim() !== "");
        const validIds = brandIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
        if (validIds.length > 0) baseMatch.brandId = { $in: validIds };
    }
    pipeline.push({ $match: baseMatch });

    // 2. Joins for Searchability
    pipeline.push(
        { $lookup: { from: "brands", localField: "brandId", foreignField: "_id", as: "brandDoc" } },
        { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "categories", localField: "subcategoryId", foreignField: "_id", as: "subCatDoc" } },
        { $unwind: { path: "$subCatDoc", preserveNullAndEmptyArrays: true } }
    );

    // 3. Search Logic
    if (search && search.trim() !== "") {
        const searchRegex = new RegExp(search.trim(), "i");
        pipeline.push({
            $match: {
                $or: [
                    { name: searchRegex },
                    { "brandDoc.name": searchRegex },
                    { "subCatDoc.name": searchRegex }
                ],
            },
        });
    }
    pipeline.push(
        { $lookup: { from: "variants", localField: "_id", foreignField: "productId", as: "variants" } },
        { $unwind: "$variants" },
        { $match: { "variants.isDeleted": false } }, 
        { $unwind: "$variants.sizes" }
    );

    if (size && size.length > 0) {
        const sizeArray = Array.isArray(size) ? size : size.split(",");
        pipeline.push({ $match: { "variants.sizes.size": { $in: sizeArray } } });
    }

    pipeline.push({
        $group: {
            _id: "$_id",
            name: { $first: "$name" },
            slug: { $first: "$slug" },
            thumbnail: { $first: { $arrayElemAt: ["$variants.images", 0] } },
            brandName: { $first: "$brandDoc.name" },
            categoryName: { $first: "$subCatDoc.name" },
            createdAt: { $first: "$createdAt" },
            isFeatured: { $first: "$isFeatured" },
            minSalePrice: { $min: "$variants.sizes.salePrice" },
            maxOriginalPrice: { $max: "$variants.sizes.originalPrice" },
            variantId: { $first: "$variants._id" },
            allVariantIds: { $addToSet: "$variants._id" }
        },
    });


    const finalMatch = { minSalePrice: { $ne: null } };
    if (minPrice || maxPrice) {
        finalMatch.minSalePrice = {
            ...(minPrice && { $gte: Number(minPrice) }),
            ...(maxPrice && { $lte: Number(maxPrice) }),
        };
    }
    pipeline.push({ $match: finalMatch });


    let sortStage = { createdAt: -1 };
    if (sort === "price_asc") sortStage = { minSalePrice: 1 };
    else if (sort === "price_desc") sortStage = { minSalePrice: -1 };
    else if (sort === "name_asc") sortStage = { name: 1 };
    pipeline.push({ $sort: sortStage });


    pipeline.push({
        $facet: {
            data: [{ $skip: skip }, { $limit: Number(limit) }],
            totalCount: [{ $count: "count" }],
        },
    });

    const result = await Product.aggregate(pipeline);
    return {
        products: result[0]?.data || [],
        totalCount: result[0]?.totalCount[0]?.count || 0
    };
};

export const getProductByIdRepository = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const pipeline = [
        { $match: { _id: new mongoose.Types.ObjectId(id), isActive: true, isDeleted: false } },
        {
            $lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brand"
            }
        },
        { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "categories",
                localField: "subcategoryId",
                foreignField: "_id",
                as: "subcategory"
            }
        },
        { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "variants",
                localField: "_id",
                foreignField: "productId",
                as: "variants"
            }
        },
        {
            $set: {
                variants: {
                    $filter: {
                        input: "$variants",
                        as: "variant",
                        cond: { $eq: ["$$variant.isDeleted", false] }
                    }
                }
            }
        }
    ];

    const result = await productModel.aggregate(pipeline);
    return result.length > 0 ? result[0] : null;
};

export const getRecommendedProducts = async (subcategoryId, currentProductId) => {
    return await Product.aggregate([
        {

            $match: {
                subcategoryId: new mongoose.Types.ObjectId(subcategoryId),
                _id: { $ne: new mongoose.Types.ObjectId(currentProductId) },
                isActive: true,
                isDeleted: false
            }
        },
        {

            $lookup: {
                from: "variants",
                localField: "_id",
                foreignField: "productId",
                as: "variant"
            }
        },
        {

            $unwind: "$variant"
        },
        {

            $match: { "variant.isDeleted": false }
        },
        {
            $project: {
                _id: 1,
                variantId: "$variant._id",
                name: 1,
                color: "$variant.color",
                hex: "$variant.hex",
                thumbnail: { $arrayElemAt: ["$variant.images", 0] },
                minSalePrice: { $min: "$variant.sizes.salePrice" }
            }
        },
        { $limit: 20 }
    ]);
};