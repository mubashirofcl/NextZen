import express from "express";
import { getProductByIdController, getProducts, getRecommended } from "./product.controller.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductByIdController);
router.get("/recommended/:subcategoryId/:currentProductId", getRecommended);
export default router;
