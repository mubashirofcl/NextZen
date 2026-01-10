import { body } from "express-validator";

export const emailValidator = body("email")
  .isEmail()
  .withMessage("Valid email is required")
  .normalizeEmail();

export const nameValidator = body("name")
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage("Name must be 2-50 characters");

export const passwordValidator = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters");

export const passwordRequiredValidator = body("password")
  .notEmpty()
  .withMessage("Password is required");

export const otpValidator = body("otp")
  .trim()
  .isLength({ min: 6, max: 6 })
  .withMessage("OTP must be 6 digits");

