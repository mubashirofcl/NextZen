import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import adminService from "./admin.service.js";
import adminRepo from "./admin.repository.js";
import Admin from "./admin.model.js";

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax", // ✅ FIXED
  path: "/",
};

export const loginAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await adminService.loginAdmin(email, password);

    res.cookie("adminAccessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("adminRefreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
};

export const refreshAdminToken = async (req, res) => {
  const refreshToken = req.cookies?.adminRefreshToken;

  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
      code: "NO_TOKEN",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.adminId).select("+refreshToken");

    if (!admin || admin.refreshToken !== refreshToken) {
      throw new Error("Invalid session");
    }

    const newAccessToken = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await adminRepo.updateRefreshToken(admin._id, newRefreshToken);

    res.cookie("adminAccessToken", newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("adminRefreshToken", newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    res.clearCookie("adminAccessToken", COOKIE_OPTIONS);
    res.clearCookie("adminRefreshToken", COOKIE_OPTIONS);

    return res.status(401).json({
      success: false,
      message: "Session expired",
      code: "SESSION_EXPIRED",
    });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;

    if (adminId) {
      await adminRepo.updateRefreshToken(adminId, null);
    }

    res.clearCookie("adminAccessToken", COOKIE_OPTIONS);
    res.clearCookie("adminRefreshToken", COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch {
    return res.status(200).json({ success: true });
  }
};
