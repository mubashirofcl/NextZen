import { getAllCategoriesForSelectionService } 
  from "../../admin/categorieManagement/category.service.js";

export const getUserCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategoriesForSelectionService({
      level: 1,     
    });

    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

export const getUserSubCategories = async (req, res, next) => {
  try {
    const { parentId } = req.query;

    if (!parentId) {
      return res.status(400).json({ message: "parentId required" });
    }

    const subcategories = await getAllCategoriesForSelectionService({
      level: 2,
      parentId,
    });

    res.status(200).json(subcategories);
  } catch (err) {
    next(err);
  }
};