import { body } from "express-validator";

export const createCategoryValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required"),

    body("level")
        .isIn([1, 2])
        .withMessage("Invalid category level"),

    body("parentId")
        .optional()
        .isMongoId()
        .withMessage("Invalid parentId"),

    body("description")
        .optional()
        .isString(),
];


export const updateCategoryValidator = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Name cannot be empty"),

    body("description")
        .optional()
        .isString(),

    body("isActive")
        .optional()
        .isBoolean(),
];