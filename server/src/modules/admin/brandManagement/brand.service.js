import * as brandRepo from "./brand.repository.js";
import { uploadBrandLogo } from "../../../utils/brandImageUpload.js";
import { deactivateProductsByBrand } from "../productManagement/product.repository.js";

export const createBrandService = async (data) => {
  const existing = await brandRepo.findBrandByName({ name: data.name });
  if (existing) {
    throw new Error("Brand already exists!");
  }

  let logoUrl = data.logo;

  if (data.logo?.startsWith("data:image")) {
    logoUrl = await uploadBrandLogo({
      base64: data.logo,
      brandName: data.name,
    });
  }

  return  brandRepo.createBrand({
    ...data,
    logo: logoUrl,
  });
};

export const updateBrandService = async (id, data = {}) => {
  const brand = await brandRepo.findBrandById(id);
  if (!brand) throw new Error("Brand not found");

  let logoUrl = data.logo;

  if (data.logo?.startsWith("data:image")) {
    logoUrl = await uploadBrandLogo({
      base64: data.logo,
      brandName: data.name || brand.name,
    });
  }

  return brandRepo.updateBrandById(id, {
    ...data,
    ...(logoUrl && { logo: logoUrl }),
  });
};

export const toggleBrandStatusService = async (id) => {
  const brand = await brandRepo.findBrandById(id);
  if (!brand) throw new Error("Brand not found");

  const newStatus = !brand.isActive;

  const updatedBrand = await brandRepo.toggleBrandStatusById(id, newStatus);

  if (newStatus === false) {
    await deactivateProductsByBrand(id);
  }

  return updatedBrand;
};

export const getBrandsService = async (query) => {
  const { page = 1, limit = 7, search, isActive } = query;

  const filter = { isDeleted: false };

  if (typeof isActive !== "undefined") {
    filter.isActive = isActive === "true";
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    brandRepo.getBrands({
      page: Number(page),
      limit: Number(limit),
      search,
      isActive:
        typeof isActive === "undefined"
          ? undefined
          : isActive === "true",
    }),
    brandRepo.countBrands(filter),
  ]);

  return {
    items,
    totalItems: total,
    currentPage: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

export const getAllBrandsForSelectionService = async () => {
  const items = await brandRepo.getBrands({
    isActive: true,
    limit: 0,
  });

  return items;
};