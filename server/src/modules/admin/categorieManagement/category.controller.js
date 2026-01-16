import {
    createCategoryService,
    deleteCategoryService,
    getCategoriesService,
    updateCategoryService,
} from "./category.service.js";

export const createCategory = async (req, res) => {
    try {
        const category = await createCategoryService(req.body);
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const getCategories = async (req, res) => {
    try {
        const {
            page = 1,
            search = "",
        } = req.query;

        const data = await getCategoriesService({
            page: Number(page),
            search,
            level: 1,
            parentId: null,

        });

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



export const getSubCategories = async (req, res) => {
    try {
        const {
            page = 1,
            search = "",
            status,
            parentId,
        } = req.query;

        const data = await getCategoriesService({
            page: Number(page),
            search,
            status,
            level: 2,
            parentId,
        });

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const updateCategory = async (req, res) => {
    try {
        const updated = await updateCategoryService(
            req.params.id,
            req.body
        );

        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteCategory = async (req, res) => {
  try {
    await deleteCategoryService(req.params.id);
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
