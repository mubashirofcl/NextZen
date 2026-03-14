import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userRepo from "./user.repository.js";
import * as otpService from "../common/otp.service.js";
import User from "./user.model.js";
import walletModel from "../wallet/wallet.model.js";

// ==================== SIGNUP OTP ====================

const requestSignupOTP = async (email) => {
  const existingUser = await userRepo.findByEmail(email.toLowerCase());
  if (existingUser) throw new Error("Email already registered");

  return await otpService.requestOTP(email.toLowerCase(), "SIGNUP");
};

const resendSignupOTP = async (email) => {
  const existingUser = await userRepo.findByEmail(email.toLowerCase());
  if (existingUser) throw new Error("Email already registered");

  return otpService.requestOTP(email, "SIGNUP");
};

const verifySignupOTP = async (email, otp, name, password, referralCode) => {
  await otpService.verifyAndConsumeOTP(email, otp, "SIGNUP");

  let referrer = null;
  if (referralCode) {
    referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (referrer && referrer.email === email.toLowerCase()) {
      referrer = null;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepo.createUser({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    isEmailVerified: true,
    referredBy: referrer ? referrer._id : null,
  });

  const joinerBonus = referrer ? 50 : 0;

  await walletModel.create({
    userId: user._id,
    balance: joinerBonus,
    transactions: referrer ? [{
      amount: 50,
      type: 'credit',
      description: 'Referral Join Bonus',
      status: 'completed',
      date: new Date()
    }] : []
  });

  if (referrer) {
    await walletModel.findOneAndUpdate(
      { userId: referrer._id },
      {
        $inc: { balance: 100 },
        $push: {
          transactions: {
            amount: 100,
            type: 'credit',
            description: `Referral Reward: ${user.name} joined`,
            status: 'completed',
            date: new Date()
          }
        }
      }
    );

    await User.findByIdAndUpdate(referrer._id, { $inc: { referralCount: 1 } });
  }

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

  await userRepo.updateRefreshToken(user._id, refreshToken);

  return { accessToken, refreshToken, user };
};

// ==================== LOGIN ====================

const loginUser = async (email, password) => {
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  await userRepo.updateLastLogin(user._id);

  const accessToken = jwt.sign({ userId: user._id },
    process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId: user._id },
    process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  await userRepo.updateRefreshToken(user._id, refreshToken);

  return { accessToken, refreshToken };
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