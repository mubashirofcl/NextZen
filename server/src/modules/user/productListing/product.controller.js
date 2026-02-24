import mongoose from "mongoose";
import { getProductByIdRepository, getRecommendedProducts } from "./product.repository.js";
import { getProductsService } from "./product.service.js";
import productModel from "../../admin/productManagement/product.model.js";

export const getProducts = async (req, res) => {
    try {
        const data = await getProductsService(req.query);
        res.status(200).json(data);
    } catch (error) {
        console.error("❌ BACKEND ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductByIdRepository(id);

        if (!product) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRecommended = async (req, res) => {
    try {
        const { subcategoryId, currentProductId } = req.params;

        let finalSubId = subcategoryId;
        if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
            const prod = await productModel.findById(currentProductId);
            finalSubId = prod?.subcategoryId || prod?.categoryId;
        }

        const products = await getRecommendedProducts(finalSubId, currentProductId);

        res.status(200).json(products || []);
    } catch (error) {
        console.error("❌ Recommendation Engine Error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};