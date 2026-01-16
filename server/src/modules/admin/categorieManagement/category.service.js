import {
    findById,
    createCategory,
    findCategories,
    countCategories,
    updateCategoryById,
} from "./category.repository.js";

export const createCategoryService = async ({
    name,
    level,
    parentId,
    description,
}) => {
    if (level === 1 && parentId) {
        throw new Error("Level 1 category cannot have parentId");
    }

    if (level === 2) {
        if (!parentId) {
            throw new Error("SubCategory must have parentId");
        }

        const parent = await findById(parentId);

        if (!parent) {
            throw new Error("Parent category not found");
        }

        if (parent.level !== 1) {
            throw new Error("SubCategory parent must be a Level 1 category");
        }
    }

    return createCategory({
        name,
        level,
        parentId: parentId || null,
        description,
    });
};

export const getCategoriesService = async ({
    page,
    search,
    status,
    level,
    parentId,
}) => {
    const limit = 5;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    if (status === "active") filter.isActive = true;
    if (status === "archived") filter.isActive = false;

    if (level !== undefined) {
        filter.level = Number(level);
    }

    if (parentId) {
        filter.parentId = parentId;
    }

    const [items, total] = await Promise.all([
        findCategories(filter, skip, limit),
        countCategories(filter),
    ]);

    return {
        items,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    };
};


export const updateCategoryService = async (id, payload) => {
    if (!id) throw new Error("Category ID missing");

    const category = await findById(id);
    if (!category) throw new Error("Category not found");

    if ("level" in payload || "parentId" in payload) {
        throw new Error("Hierarchy cannot be modified");
    }

    return updateCategoryById(id, payload);
};

export const deleteCategoryService = async (id) => {
    const category = await findById(id);
    if (!category) throw new Error("Category not found");

    return updateCategoryById(id, { isDeleted: true });
};
