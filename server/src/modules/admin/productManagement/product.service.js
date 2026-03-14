import mongoose from "mongoose";
import Variant from "./variant.model.js";
import categoryModel from "../categorieManagement/category.model.js";
import brandModel from "../brandManagement/brand.model.js";
import { processVariantImages } from "../../../utils/cloudinaryProductUpload.js";
import {
    createProductRepo,
    updateProductById,
    softDeleteProduct,
    getAdminProductsRepo,
    findProductById,
    createVariantsRepo,
    findVariantsByProductId,
} from "./product.repository.js";


const validateAndFilterVariants = (variants) => {
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
        throw new Error("At least one colorway (variant) is required.");
    }

    return variants.map((v, index) => {
        if (!v.images || v.images.length < 3) {
            throw new Error(`Variant ${index + 1} (${v.color || 'Unnamed'}) requires at least 3 images.`);
        }

        const validSizes = v.sizes.filter(s =>
            s.stock !== "" &&
            s.stock != null &&
            Number(s.originalPrice) > 0 &&
            Number(s.salePrice) > 0
        );

        if (validSizes.length === 0) {
            throw new Error(`Variant ${index + 1} (${v.color}) must have at least one size with stock and price.`);
        }

        return { ...v, sizes: validSizes };
    });
};

export const createProductService = async (payload) => {
    let { variants, categoryId, subcategoryId, brandId, offerId, ...productData } = payload;

    const validVariants = validateAndFilterVariants(variants);

    const [category, subCategory, brand] = await Promise.all([
        categoryModel.findById(categoryId),
        categoryModel.findById(subcategoryId),
        brandModel.findOne({ _id: brandId, isActive: true, isDeleted: false })
    ]);

    if (!category?.isActive) throw new Error("Parent category is inactive.");
    if (!subCategory?.isActive) throw new Error("Sub-category is inactive.");
    if (!brand) throw new Error("Selected brand is blocked or deleted.");

    const resolvedOfferId = (offerId && mongoose.Types.ObjectId.isValid(offerId)) ? offerId : null;

    const product = await createProductRepo({
        ...productData,
        categoryId,
        subcategoryId,
        brandId: brand._id,
        offerId: resolvedOfferId
    });

    const processedVariants = await processVariantImages({
        variants: validVariants,
        productId: product._id,
    });

    await createVariantsRepo(
        processedVariants.map(v => ({ ...v, productId: product._id }))
    );

    return product;
};

export const updateProductService = async (productId, payload) => {
    const { variants, categoryId, subcategoryId, brandId, offerId, ...productData } = payload;
    const cleanProductId = new mongoose.Types.ObjectId(productId);

    if (categoryId || subcategoryId || brandId) {
        const [category, sub, brand] = await Promise.all([
            categoryId ? categoryModel.findById(categoryId) : null,
            subcategoryId ? categoryModel.findById(subcategoryId) : null,
            brandId ? brandModel.findOne({ _id: brandId, isDeleted: false }) : null
        ]);

        if (categoryId && (!category || !category.isActive)) throw new Error("Selected category is inactive");
        if (subcategoryId && (!sub || !sub.isActive)) throw new Error("Selected sub-category is inactive");
        if (brandId && (!brand || !brand.isActive)) throw new Error("Selected brand is inactive/blocked");
    }

    if (variants !== undefined) {
        if (!Array.isArray(variants) || variants.length === 0) throw new Error("At least one variant is required");

        for (let vIdx = 0; vIdx < variants.length; vIdx++) {
            const v = variants[vIdx];
            if (!v.images || v.images.length < 3) {
                throw new Error(`Variant ${vIdx + 1} (${v.color}) must have at least 3 images`);
            }

            v.sizes = v.sizes.filter(s => s.stock !== "" && s.originalPrice !== "");

            v.sizes.forEach(size => {
                if (!size.salePrice || Number(size.salePrice) === 0) size.salePrice = size.originalPrice;
                if (Number(size.salePrice) > Number(size.originalPrice)) throw new Error("Sale price > Market price");
            });
        }
    }

    const resolvedOfferId = (offerId && offerId !== "" && mongoose.Types.ObjectId.isValid(offerId)) 
        ? offerId 
        : null;

    const updatedProduct = await updateProductById(cleanProductId, {
        ...productData,
        categoryId,
        subcategoryId,
        brandId,
        offerId: resolvedOfferId 
    });

    if (!updatedProduct) throw new Error("Product not found");

    if (variants !== undefined) {
        const activeVariantIds = [];
        for (const variant of variants) {
            const [processed] = await processVariantImages({
                variants: [variant],
                productId: cleanProductId,
            });

            if (variant._id && mongoose.Types.ObjectId.isValid(variant._id)) {
                const updatedV = await Variant.findOneAndUpdate(
                    { _id: variant._id, productId: cleanProductId },
                    processed,
                    { new: true }
                );
                if (updatedV) activeVariantIds.push(updatedV._id.toString());
            } else {
                const [created] = await Variant.create([{ ...processed, productId: cleanProductId }]);
                activeVariantIds.push(created._id.toString());
            }
        }

        await Variant.updateMany(
            { productId: cleanProductId, _id: { $nin: activeVariantIds }, isDeleted: false },
            { $set: { isDeleted: true } }
        );
    }

    return updatedProduct;
};


export const getAdminProductsService = async ({ page = 1, search = "", subcategoryId = "" }) => {
    return getAdminProductsRepo({
        page: Number(page),
        limit: 5,
        search,
        subcategoryId,
    });
};

export const getProductDetailsService = async (id) => {
    const product = await findProductById(id);
    if (!product) throw new Error("Product not found");

    const variants = await findVariantsByProductId(id);

    let masterSizes = ["S", "M", "L", "XL", "XXL"];
    if (product.sizeType === "FREE_SIZE") masterSizes = ["FREE"];
    if (product.sizeType === "NO_SIZE") masterSizes = ["ONE"];

    const processedVariants = variants.map(variant => {
        const variantObj = variant.toObject();
        const existingSizeMap = new Map(variantObj.sizes.map(s => [s.size, s]));

        variantObj.sizes = masterSizes.map(sizeName => {
            const existing = existingSizeMap.get(sizeName);
            return {
                size: sizeName,
                stock: existing ? existing.stock : "",
                originalPrice: existing ? existing.originalPrice : "",
                salePrice: existing ? existing.salePrice : "",
                isActive: existing ? existing.isActive : true,
                _id: existing ? existing._id : undefined
            };
        });
        return variantObj;
    });

    return {
        ...product.toObject(),
        variants: processedVariants
    };
};

export const deleteProductService = async (id) => {
    await softDeleteProduct(id);
    await Variant.updateMany(
        { productId: new mongoose.Types.ObjectId(id) },
        { $set: { isDeleted: true } }
    );
};