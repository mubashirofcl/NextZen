import Category from "./category.model.js";

export const findById = (id) => {
  return Category.findById(id);
};

export const findCategories = (filter, skip, limit) => {
  return Category.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const countCategories = (filter) => {
  return Category.countDocuments(filter);
};

export const createCategory = (payload) => {
  return Category.create(payload);
};

export const updateCategoryById = (id, payload) => {
  return Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};
