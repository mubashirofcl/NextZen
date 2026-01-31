import { body } from "express-validator";


export const createProductValidator = [
  body("name").notEmpty(),
  body("categoryId").notEmpty(),
  body("subcategoryId").notEmpty(),

  body("variants").isArray({ min: 1 }),

  body("variants.*.color").notEmpty(),
  body("variants.*.hex").notEmpty(),
  body("variants.*.images").isArray({ min: 3 }),

  body("variants.*.sizes").isArray({ min: 1 }),
  body("variants.*.sizes.*.size").notEmpty(),
  body("variants.*.sizes.*.stock").isInt({ min: 0 }),
  body("variants.*.sizes.*.salePrice").isFloat({ min: 0 }),

];

export const updateProductValidator = [
  body("name").optional().notEmpty(),
  body("variants").optional().isArray({ min: 1 }),

];
