import User from "./user.model.js";
import OTP from "../common/otp.model.js";

// ==================== USER OPERATIONS ====================

const findByEmail = async (email) => {
  return await User.findOne({ email }).select('+password');
};

const findById = async (userId) => {
  return await User.findById(userId).select('-password');
};

const createUser = async (userData) => {
  return await User.create(userData);
};

const updateLastLogin = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { lastLoginAt: new Date() },
    { new: true }
  );
};

const updateRefreshToken = async (userId, token) => {
  return await User.findByIdAndUpdate(userId, { refreshToken: token });
};

// ==================== OTP OPERATIONS ====================

const createOTP = async (email, otp, purpose) => {
  await OTP.deleteMany({ email, purpose, isUsed: false });

  return await OTP.create({
    email,
    otp,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
};

const findValidOTP = async (email, otp, purpose) => {
  return await OTP.findOne({
    email,
    otp,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });
};

const markOTPAsUsed = async (otpId) => {
  return await OTP.findByIdAndUpdate(otpId, { isUsed: true }, { new: true });
};

const findRecentOTP = async (email, purpose) => {
  return await OTP.findOne({
    email,
    purpose,
  }).sort({ createdAt: -1 }); 
};


const updatePassword = async (email, newPassword) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    user.password = newPassword;
    return await user.save();
};

export default {
  findByEmail,
  findById,
  createUser,
  updateLastLogin,
  updateRefreshToken,
  createOTP,
  findValidOTP,
  markOTPAsUsed,
  findRecentOTP,
  updatePassword
};