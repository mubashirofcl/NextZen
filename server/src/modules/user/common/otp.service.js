import userRepo from "../userCore/user.repository.js";
import { generateOTP, sendOTPEmail } from "../../../utils/otp.util.js";

// ==================== REQUEST OTP ====================
export const requestOTP = async (email, purpose) => {
  const normalizedEmail = email.toLowerCase();
  const recentOTP = await userRepo.findRecentOTP(normalizedEmail, purpose);

  if (recentOTP) {
    const timeSinceCreation = Date.now() - new Date(recentOTP.createdAt).getTime();
    const waitTime = 10_000;

    if (timeSinceCreation < waitTime) {
      const remainingSeconds = Math.ceil((waitTime - timeSinceCreation) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new OTP`);
    }
  }

  const otp = generateOTP();
  await userRepo.createOTP(normalizedEmail, otp, purpose);

  try {
    await sendOTPEmail({
        to: normalizedEmail, 
        otp,
        purpose
    });
} catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
}

  return {
    email: normalizedEmail,
    message: "OTP sent successfully",
  };
};

// ==================== VERIFY ONLY (NO CONSUME) ====================
export const verifyOTPOnly = async (email, otp, purpose) => {
  const validOTP = await userRepo.findValidOTP(
    email.toLowerCase(),
    otp,
    purpose
  );

  if (!validOTP) {
    throw new Error("Invalid or expired OTP");
  }

  return validOTP;
};

// ==================== VERIFY + CONSUME ====================
export const verifyAndConsumeOTP = async (email, otp, purpose) => {
  const validOTP = await verifyOTPOnly(email, otp, purpose);
  await userRepo.markOTPAsUsed(validOTP._id);
};
