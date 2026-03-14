import express from "express";
import adminAuth from "../../../middlewares/adminAuth.middleware.js";

import {
  createProduct,
  getAdminProducts,
  getProductDetails,
  updateProduct,
  deleteProduct,
} from "./product.controller.js";

import {
  createProductValidator,
  updateProductValidator,
} from "./product.validation.js";

const router = express.Router();

router.get("/products", adminAuth, getAdminProducts);

router.post(
  "/products",
  adminAuth,
  createProductValidator,
  createProduct
);


router.get(
  "/products/:id",
  adminAuth,
  getProductDetails
);

router.patch(
  "/products/:id",
  adminAuth,
  updateProductValidator,
  updateProduct
);

router.delete(
  "/products/:id",
  adminAuth,
  deleteProduct
);

export default router;
