import userRepo from "../userCore/user.repository.js";
import { generateOTP, sendOTPEmail } from "../../../utils/otp.util.js";


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
        if (process.env.NODE_ENV === 'production') throw new Error("Failed to send verification email. Please try again.");
        console.error("OTP Email Error:", error.message);
    }

    return {
        email: normalizedEmail,
        message: "Verification code sent to your email.",
    };
};


export const verifyOTPOnly = async (email, otp, purpose) => {
    const normalizedEmail = email.toLowerCase();
  
    const existingOTP = await userRepo.findActiveOTPRecord(normalizedEmail, purpose);

    if (!existingOTP) {
        throw new Error("Invalid or expired code. Please request a new one.");
    }


    try {
        await existingOTP.incrementAttempts();
    } catch (error) {
        throw error; 
    }

    if (existingOTP.otp !== otp) {
        const remaining = 5 - existingOTP.attempts;
        throw new Error(`Incorrect code. You have ${remaining} attempts remaining.`);
    }

    return existingOTP;
};


export const verifyAndConsumeOTP = async (email, otp, purpose) => {
    const validOTP = await verifyOTPOnly(email, otp, purpose);
    
    await userRepo.markOTPAsUsed(validOTP._id);
    
    return true;
};