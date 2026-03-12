import bcrypt from "bcryptjs";
import User from "../userCore/user.model.js";
import * as profileService from "./profile.service.js";
import SERVER_MESSAGES from "../../../utils/errorMessages.js";


export const getUserMe = async (req, res) => {
  try {
    const user = await profileService.getUserMe(req.user.userId);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const result = await profileService.updateProfile(
      req.user.userId,
      req.body
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};


export const verifyEmailChange = async (req, res) => {
  try {
    const user = await profileService.verifyEmailChange(
      req.user.userId,
      req.body.email,
      req.body.otp
    );

    return res.status(SERVER_MESSAGES.USER.PROFILE_UPDATED.status).json({
      success: true,
      message: SERVER_MESSAGES.USER.PROFILE_UPDATED.message,
      user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};


export const resendEmailChangeOTP = async (req, res) => {
  try {
    await profileService.resendEmailChangeOTP(
      req.user.userId,
      req.body.email
    );

    return res.status(SERVER_MESSAGES.VERIFICATION.OTP_SENT.status).json({
      success: true,
      message: SERVER_MESSAGES.VERIFICATION.OTP_SENT.message,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};


export const changePassword = async (req, res) => {

  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(SERVER_MESSAGES.USER.PASSWORD_MISSING.status).json({
        success: false,
        message: SERVER_MESSAGES.USER.PASSWORD_MISSING.message,
        code: SERVER_MESSAGES.USER.PASSWORD_MISSING.code
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(SERVER_MESSAGES.USER.NOT_FOUND.status).json({
        success: false,
        message: SERVER_MESSAGES.USER.NOT_FOUND.message,
        code: SERVER_MESSAGES.USER.NOT_FOUND.code
      });
    }

    if (user.googleId) {
      return res.status(SERVER_MESSAGES.AUTH.GOOGLE_ACCOUNT_PASSWORD.status).json({
        success: false,
        message: SERVER_MESSAGES.AUTH.GOOGLE_ACCOUNT_PASSWORD.message,
        code: SERVER_MESSAGES.AUTH.GOOGLE_ACCOUNT_PASSWORD.code
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(SERVER_MESSAGES.USER.PASSWORD_INCORRECT.status).json({
        success: false,
        message: SERVER_MESSAGES.USER.PASSWORD_INCORRECT.message,
        code: SERVER_MESSAGES.USER.PASSWORD_INCORRECT.code
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return res.status(SERVER_MESSAGES.VERIFICATION.PASSWORD_SET.status).json({
      success: true,
      message: SERVER_MESSAGES.VERIFICATION.PASSWORD_SET.message,
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update password",
    });
  }

};