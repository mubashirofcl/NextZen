import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import userService from "./user.service.js";
import { verifyOTPOnly } from "../common/otp.service.js";
import userRepo from "./user.repository.js";

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
    const { email, otp, name, password } = req.body;

    const { accessToken, refreshToken, user } =
      await userService.verifySignupOTP(email, otp, name, password);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("userAccessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("userAccessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, message: "Login successful" });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
};

// ==================== REFRESH TOKEN ====================

export const refreshUserToken = async (req, res) => {
  const refreshToken = req.cookies.userRefreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await userRepo.findById(decoded.userId);

    if (!user || user.isBlocked) {
      res.clearCookie("userAccessToken");
      res.clearCookie("userRefreshToken");
      return res.status(403).json({ blocked: true });
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

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("userAccessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true });
  } catch {
    res.clearCookie("userAccessToken");
    res.clearCookie("userRefreshToken");
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

export const logoutUser = (req, res) => {
  res.clearCookie("userAccessToken").clearCookie("userRefreshToken");
  return res.status(200).json({ success: true });
};
