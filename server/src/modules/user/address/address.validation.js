import { body, param } from "express-validator";

/* ==================== CREATE ADDRESS ==================== */

export const createAddressSchema = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("phone")
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Valid Indian phone number is required"),

  body("addressLine")
    .trim()
    .isLength({ min: 5 })
    .withMessage("Address line is required"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  body("pincode")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be 6 digits"),

  body("landmark")
    .optional({ nullable: true })
    .trim(),

  body("addressType")
    .isIn(["Home", "Office"])
    .withMessage("Address type must be Home or Office"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be boolean"),
];

/* ==================== UPDATE ADDRESS ==================== */

export const updateAddressSchema = [
  param("id")
    .isMongoId()
    .withMessage("Invalid address id"),

  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Valid Indian phone number is required"),

  body("addressLine")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Address line must be at least 5 characters"),

  body("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty"),

  body("state")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("State cannot be empty"),

  body("pincode")
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("Pincode must be 6 digits"),

  body("landmark")
    .optional({ nullable: true })
    .trim(),

  body("addressType")
    .optional()
    .isIn(["Home", "Office"])
    .withMessage("Address type must be Home or Office"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be boolean"),
];

/* ==================== DELETE / SET DEFAULT ==================== */

export const addressIdParamSchema = [
  param("id")
    .isMongoId()
    .withMessage("Invalid address id"),
];
