import asyncHandler from "../../../utils/asyncHandler.js";
import {
  getAdminProductsService,
  createProductService,
  getProductDetailsService,
  updateProductService,
  deleteProductService,
} from "./product.service.js";

export const getAdminProducts = asyncHandler(async (req, res) => {
  const result = await getAdminProductsService(req.query);
  res.status(200).json(result);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await createProductService(req.body);
  res.status(201).json(product);
});

export const getProductDetails = asyncHandler(async (req, res) => {
  const product = await getProductDetailsService(req.params.id);
  res.status(200).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await updateProductService(req.params.id, req.body);
  res.status(200).json({
    message: "Product updated successfully",
    product
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await deleteProductService(req.params.id);
  res.status(204).end();
});