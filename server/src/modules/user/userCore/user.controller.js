import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import userService from "./user.service.js";
import { verifyOTPOnly } from "../common/otp.service.js";
import userRepo from "./user.repository.js";
import User from "./user.model.js";

// ==================== COOKIE CONFIG ====================

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,                 // false on localhost
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

// ==================== SIGNUP OTP ====================

export const requestSignupOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const result = await userService.requestSignupOTP(email.toLowerCase());

    return res.status(200).json({
      success: true,
      message: result.message,
      email: result.email,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== RESEND SIGNUP OTP ====================

export const resendSignupOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const result = await userService.resendSignupOTP(email);

    return res.status(200).json({
      success: true,
      message: result.message,
      email: result.email,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== VERIFY SIGNUP OTP ====================

export const verifySignupOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, otp, name, password, referralCode } = req.body;

    const { accessToken, refreshToken, user } =
      await userService.verifySignupOTP(email, otp, name, password, referralCode);

    res.cookie("userAccessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== LOGIN ====================

export const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        blocked: true,
        reason: user.blockReason || "Your account has been blocked",
      });
    }

    const { accessToken, refreshToken } =
      await userService.loginUser(email, password);

    res.cookie("userAccessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, message: "Login successful" });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
};

// ==================== REFRESH TOKEN ====================

export const refreshUserToken = async (req, res) => {
  const cookieRefreshToken = req.cookies.userRefreshToken;

  if (!cookieRefreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(
      cookieRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user || user.isBlocked || user.refreshToken !== cookieRefreshToken) {
      res.clearCookie("userAccessToken", COOKIE_OPTIONS);
      res.clearCookie("userRefreshToken", COOKIE_OPTIONS);
      return res.status(403).json({ success: false });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await userRepo.updateRefreshToken(user._id, newRefreshToken);

    res.cookie("userAccessToken", newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true });
  } catch {
    res.clearCookie("userAccessToken", COOKIE_OPTIONS);
    res.clearCookie("userRefreshToken", COOKIE_OPTIONS);
    return res.status(401).json({ success: false });
  }
};

// ==================== FORGOT / RESET PASSWORD ====================

export const requestForgotPasswordOTP = async (req, res) => {
  try {
    await userService.requestForgotPasswordOTP(req.body.email);
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const resendForgotPasswordOTP = requestForgotPasswordOTP;

export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    await verifyOTPOnly(req.body.email, req.body.otp, "FORGOT_PASSWORD");
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    await userService.resetPasswordWithOTP(
      req.body.email,
      req.body.otp,
      req.body.password
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==================== LOGOUT ====================

export const logoutUser = async (req, res) => {
  try {
    if (req.user?.userId) {
      await userRepo.updateRefreshToken(req.user.userId, null);
    }

    res.clearCookie("userAccessToken", COOKIE_OPTIONS);
    res.clearCookie("userRefreshToken", COOKIE_OPTIONS);

    return res.status(200).json({ success: true });
  } catch {
    return res.status(200).json({ success: true });
  }
};

export const googleCallback = async (req, res) => {
  const referralCode = req.query.state;

};