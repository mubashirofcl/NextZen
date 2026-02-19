import Brand from "./brand.model.js";


export const createBrand = (data) => {
  return Brand.create(data);
};

export const findBrandById = (id) => {
  return Brand.findOne({ _id: id, isDeleted: false }).populate("offerId");
};

export const updateBrandById = (id, data) => {
  return Brand.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true }
  ).populate("offerId");
};

export const toggleBrandStatusById = (id, isActive) => {
  return Brand.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isActive },
    { new: true }
  );
};

export const getBrands = ({ page, limit, search, isActive }) => {
  const query = { isDeleted: false };

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const result = Brand.find(query).populate("offerId").sort({ createdAt: -1 });

  if (limit > 0) {
    result.skip((page - 1) * limit).limit(limit);
  }

  return result;
};

export const countBrands = (filter) => {
  return Brand.countDocuments(filter);
};

export const findBrandByName = ({ name }) => {
  const query = {
    name: { $regex: `^${name}$`, $options: "i" },
    isDeleted: false,
  };

  return Brand.findOne(query);
};