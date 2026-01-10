import express from "express";
import {
    getUserMe,
    updateProfile,
    verifyEmailChange,
    resendEmailChangeOTP,
    changePassword,
} from "./profile.controller.js";

import userAuth from "../../../middlewares/userAuth.middleware.js";
import checkBlockedUser from "../../../middlewares/checkBlockedUser.js";
import validateProfileImage from "../../../middlewares/imageValidator.js";

const router = express.Router();

// ==================== PROTECTED PROFILE ROUTES ====================

router.use(userAuth);
router.use(checkBlockedUser);

router.get("/me", getUserMe);
router.put("/update", validateProfileImage, updateProfile);
router.post("/verify-email-change", verifyEmailChange);
router.post("/resend-email-otp", resendEmailChangeOTP);

router.post("/change-password", changePassword);

export default router;
