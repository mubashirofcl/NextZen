///  → HTTP handlers

import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import adminService from "./admin.service.js";
import adminRepo from "./admin.repository.js";

// Login admin and set tokens in HTTP-only cookies

export const loginAdmin = async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken } = await adminService.loginAdmin(
      email,
      password
    );

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("adminAccessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
    });
    
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

// Logout admin by clearing the cookies

export const logoutAdmin = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res
    .clearCookie("adminAccessToken", {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction,
      path: "/",
    })
    .clearCookie("adminRefreshToken", {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction,
      path: "/",
    });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Get current admin details

export const getAdminMe = async (req, res) => {
  try {
    const admin = await adminRepo.findById(req.admin.adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin details",
    });
  }
};

// Refresh admin tokens

export const refreshAdminToken = (req, res) => {
  const refreshToken = req.cookies.adminRefreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { adminId: decoded.adminId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { adminId: decoded.adminId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("adminAccessToken", newAccessToken, {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("adminRefreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    res.clearCookie("adminRefreshToken");
    res.clearCookie("adminAccessToken");

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};