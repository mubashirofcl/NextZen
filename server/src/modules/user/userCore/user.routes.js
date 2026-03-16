import express from "express";
import {
  requestSignupOTP,
  verifySignupOTP,
  resendSignupOTP,
  loginUser,
  logoutUser,
  refreshUserToken,
  requestForgotPasswordOTP,
  resendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
} from "./user.controller.js";

import { verifyOTPValidator } from "./user.validation.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";
import rateLimit from "express-rate-limit";
import {
  emailValidator,
  passwordValidator,
  otpValidator,
} from "../../../validators/common.validators.js";
import checkBlockedUser from "../../../middlewares/checkBlockedUser.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  skipSuccessfulRequests: true,
});

router.post("/signup/request-otp", emailValidator, requestSignupOTP);
router.post("/signup/resend-otp", emailValidator, resendSignupOTP);
router.post("/signup/verify-otp", verifyOTPValidator, verifySignupOTP);

router.post("/login", loginLimiter, loginUser);
router.post("/refresh", refreshUserToken);

router.post("/forgot-password/request-otp", emailValidator, requestForgotPasswordOTP);
router.post("/forgot-password/resend-otp", emailValidator, resendForgotPasswordOTP);
router.post(
  "/forgot-password/verify-otp",
  [emailValidator, otpValidator],
  verifyForgotPasswordOTP
);
router.post(
  "/reset-password",
  [emailValidator, otpValidator, passwordValidator],
  resetPassword
);

router.use(userAuth);
router.use(checkBlockedUser);

router.post("/logout", logoutUser);

export default router;
