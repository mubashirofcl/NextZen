import asyncHandler from "../../../utils/asyncHandler.js";
import * as brandService from "./brand.service.js";

export const createBrand = asyncHandler(async (req, res) => {
  try {
    const brand = await brandService.createBrandService(req.body);
    res.status(201).json(brand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export const updateBrand = asyncHandler(async (req, res) => {
  try {
    const brand = await brandService.updateBrandService(
      req.params.id,
      req.body
    );
    res.json(brand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export const toggleBrandStatus = asyncHandler(async (req, res) => {
  const brand = await brandService.toggleBrandStatusService(req.params.id);
  res.json(brand);
});

export const getBrands = asyncHandler(async (req, res) => {
  const result = await brandService.getBrandsService(req.query);
  res.json(result);
});

export const getBrandsForSelection = asyncHandler(async (req, res) => {
  const brands = await brandService.getAllBrandsForSelectionService();
  res.json(brands);
});
