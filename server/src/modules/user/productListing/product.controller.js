import { getProductByIdRepository, getRecommendedProducts } from "./product.repository.js";
import { getProductsService } from "./product.service.js";

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

        const products = await getRecommendedProducts(subcategoryId, currentProductId);

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};