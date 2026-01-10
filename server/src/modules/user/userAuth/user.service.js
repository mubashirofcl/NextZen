import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userRepo from "../common/user.repository.js";
import * as otpService from "../common/otp.service.js";

// ==================== SIGNUP OTP ====================

const requestSignupOTP = async (email) => {
  const existingUser = await userRepo.findByEmail(email.toLowerCase());
  if (existingUser) throw new Error("Email already registered");

  return otpService.requestOTP(email, "SIGNUP");
};

const resendSignupOTP = async (email) => {
  const existingUser = await userRepo.findByEmail(email.toLowerCase());
  if (existingUser) throw new Error("Email already registered");

  return otpService.requestOTP(email, "SIGNUP");
};

const verifySignupOTP = async (email, otp, name, password) => {
  await otpService.verifyAndConsumeOTP(email, otp, "SIGNUP");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepo.createUser({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    isEmailVerified: true,
  });

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken, user };
};

// ==================== LOGIN ====================

const loginUser = async (email, password) => {
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  await userRepo.updateLastLogin(user._id);

  return {
    accessToken: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    }),
    refreshToken: jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    }),
  };
};

// ==================== FORGOT PASSWORD ====================

const requestForgotPasswordOTP = async (email) => {
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) throw new Error("No account found with this email");

  if (user.googleId) {
    throw new Error(
      "This account uses Google Sign-In. Please log in using Google."
    );
  }

  return otpService.requestOTP(email, "FORGOT_PASSWORD");
};


const resetPasswordWithOTP = async (email, otp, newPassword) => {
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) throw new Error("User not found");

  if (user.googleId) {
    throw new Error(
      "Password reset is not allowed for Google accounts."
    );
  }

  await otpService.verifyAndConsumeOTP(email, otp, "FORGOT_PASSWORD");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepo.updatePassword(email.toLowerCase(), hashedPassword);
};

export default {
  requestSignupOTP,
  resendSignupOTP,
  verifySignupOTP,
  loginUser,
  requestForgotPasswordOTP,
  resetPasswordWithOTP,
};
