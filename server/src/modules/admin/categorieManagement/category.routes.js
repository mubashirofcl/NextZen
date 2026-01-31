import express from "express";
import {
    createCategory,
    deleteCategory,
    getAllCategoriesForSelection,
    getCategories,
    getSubCategories,
    updateCategory,
} from "../../admin/categorieManagement/category.controller.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", getCategories);
router.get("/selection", getAllCategoriesForSelection);
router.get("/sub", getSubCategories);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);



export default router;
