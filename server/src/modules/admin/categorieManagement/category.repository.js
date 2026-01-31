import Category from "./category.model.js";

export const findById = (id) => {
  return Category.findById(id);
};

export const findCategories = (filter, skip, limit) => {
  const query = Category.find(filter).sort({ createdAt: -1 });

  if (limit > 0) {
    query.skip(skip).limit(limit);
  }

  return query;
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

export const findCategoriesWithSubCount = async (filter, skip, limit) => {
  return Category.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "parentId",
        as: "subCategories",
      },
    },
    {
      $addFields: {
        subCategoryCount: {
          $size: {
            $filter: {
              input: "$subCategories",
              as: "sub",
              cond: { $eq: ["$$sub.isDeleted", false] },
            },
          },
        },
      },
    },
    {
      $project: {
        subCategories: 0,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
};

export const findCategoryByName = ({ name, level, parentId }) => {
  const query = {
    name: { $regex: `^${name}$`, $options: "i" },
    level,
    isDeleted: false,
  };

  if (level === 2) {
    query.parentId = parentId;
  }

  return Category.findOne(query);
};


export const findSubCategoryByNameAndParent = ({ name, parentId }) => {
  return Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
    parentId,
    level: 2,
    isDeleted: false,
  });
};
