import bcrypt from "bcryptjs";
import User from "../common/user.model.js";
import * as profileService from "./profile.service.js";

// ==================== GET USER PROFILE ====================

export const getUserMe = async (req, res) => {
  try {
    const user = await profileService.getUserMe(req.user.userId);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE PROFILE ====================

export const updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateProfile(
      req.user.userId,
      req.body
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== VERIFY EMAIL CHANGE ====================

export const verifyEmailChange = async (req, res) => {
  try {
    const user = await profileService.verifyEmailChange(
      req.user.userId,
      req.body.email,
      req.body.otp
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== RESEND EMAIL CHANGE OTP ====================

export const resendEmailChangeOTP = async (req, res) => {
  try {
    await profileService.resendEmailChangeOTP(
      req.user.userId,
      req.body.email
    );

    return res.status(200).json({
      success: true,
      message: "Verification code resent successfully",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== CHANGE PASSWORD PROFILE ====================

export const changePassword = async (req, res) => {

  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔒 HARD BLOCK GOOGLE USERS
    if (user.authSource === "google" || user.isGoogleUser) {
      return res.status(403).json({
        success: false,
        message: "Password change is not allowed for Google accounts",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
  console.error("CHANGE_PASSWORD_ERROR:", error);
  return res.status(500).json({
    success: false,
    message: error.message || "Failed to update password",
  });
}

};