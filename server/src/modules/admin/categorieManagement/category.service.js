import User from "../../user/userCore/user.model.js";
import {
    findById,
    createCategory,
    findCategories,
    countCategories,
    updateCategoryById,
    findCategoriesWithSubCount,
    findCategoryByName,
    findSubCategoryByNameAndParent,
} from "./category.repository.js";

export const createCategoryService = async ({ name, level, parentId, description }) => {
    name = name.trim();

    if (level === 1 && parentId) {
        throw new Error("Level 1 category cannot have parentId");
    }

    if (level === 2) {
        if (!parentId) throw new Error("SubCategory must have parentId");

        const parent = await findById(parentId);
        if (!parent) throw new Error("Parent category not found");
        if (parent.level !== 1) {
            throw new Error("SubCategory parent must be a Level 1 category");
        }

        const existingSub = await findSubCategoryByNameAndParent({
            name,
            parentId,
        });

        if (existingSub) {
            throw new Error("Sub-category already exists!");
        }
    }

    if (level === 1) {
        const existingCategory = await findCategoryByName({
            name,
            level: 1,
        });

        if (existingCategory) {
            throw new Error("Category already exists!");
        }
    }

    return createCategory({
        name,
        level,
        parentId: parentId || null,
        description,
    });
};

export const getCategoriesService = async ({ page, search, status, level, parentId, isActive }) => {
    const limit = 6;
    const skip = (page - 1) * limit;
    const filter = { isDeleted: false };

    if (search) filter.name = { $regex: search, $options: "i" };

    if (typeof isActive === "boolean") filter.isActive = isActive;
    if (status === "active") filter.isActive = true;
    if (status === "archived") filter.isActive = false;

    if (level !== undefined) filter.level = Number(level);
    if (parentId) filter.parentId = parentId;

    const items = Number(level) === 1 || level === undefined
        ? await findCategoriesWithSubCount(filter, skip, limit)
        : await findCategories(filter, skip, limit);

    const total = await countCategories(filter);

    return {
        items,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    };
};

export const getAllCategoriesForSelectionService = async ({ level, parentId, adminMode = false }) => {
    const filter = { isDeleted: false };

    if (!adminMode) {
        filter.isActive = true;
    }

    if (level !== undefined) filter.level = Number(level);
    if (parentId) filter.parentId = parentId;

    return await findCategories(filter, 0, 0);
};

export const updateCategoryService = async (id, payload) => {
    if (!id) throw new Error("Category ID missing");

    const category = await findById(id);
    if (!category) throw new Error("Category not found");

    if ("level" in payload || "parentId" in payload) {
        throw new Error("Hierarchy (level or parent) cannot be modified");
    }

    if (payload.name) {
        const newName = payload.name.trim();

        if (newName.toLowerCase() !== category.name.toLowerCase()) {

            if (category.level === 1) {

                const existing = await findCategoryByName({
                    name: newName,
                    level: 1
                });

                if (existing && existing._id.toString() !== id) {
                    throw new Error("Category name already exists!");
                }
            }
            else if (category.level === 2) {

                const existing = await findSubCategoryByNameAndParent({
                    name: newName,
                    parentId: category.parentId
                });

                if (existing && existing._id.toString() !== id) {
                    throw new Error("Sub-category name already exists under this parent!");
                }
            }
        }

        payload.name = newName;
    }

    return updateCategoryById(id, payload);
};

export const deleteCategoryService = async (id) => {
    const category = await findById(id);
    if (!category) throw new Error("Category not found");
    return updateCategoryById(id, { isDeleted: true });
};