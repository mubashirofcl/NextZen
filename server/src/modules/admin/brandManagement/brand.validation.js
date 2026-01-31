import { body, param, query } from "express-validator";

export const createBrandValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Brand name is required"),

  body("logo")
    .notEmpty()
    .withMessage("Brand logo is required"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),
];


export const updateBrandValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid brand id"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Brand name cannot be empty"),

  body("logo")
    .optional()
    .notEmpty()
    .withMessage("Brand logo cannot be empty"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),
];


export const getBrandsValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1 }),
  query("search").optional().isString(),
  query("isActive").optional().isBoolean(),
];
