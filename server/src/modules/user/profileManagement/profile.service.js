import User from "../userCore/user.model.js";
import userRepo from "../userCore/user.repository.js";
import OTP from "../common/otp.model.js";
import { uploadProfileImage, extractPublicId } from "../../../utils/uploadImage.js";
import { generateOTP, sendOTPEmail } from "../../../utils/otp.util.js";

/**
 * GET USER PROFILE
 */
export const getUserMe = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
};

/**
 * UPDATE PROFILE (NAME / PHONE / IMAGE / EMAIL CHANGE FLOW)
 */
export const updateProfile = async (userId, payload) => {
    let { name, phone, email, profilePicture } = payload;

    name = name?.trim();
    phone = phone?.trim();
    email = email?.toLowerCase().trim();

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // ================= IMAGE HANDLING =================

    let imageUrl = user.profilePicture;

    if (profilePicture && profilePicture.startsWith("data:image")) {
        const oldPublicId = imageUrl ? extractPublicId(imageUrl) : null;
        imageUrl = await uploadProfileImage(profilePicture, userId, oldPublicId);
    }

    const isEmailChanging = email && email !== user.email;

    // ================= NO EMAIL CHANGE =================
    if (!isEmailChanging) {
        const updateFields = {
            name: name || user.name,
            phone: phone || user.phone,
        };

        if (user.profilePicture !== undefined) updateFields.profilePicture = imageUrl;
        if (user.image !== undefined) updateFields.image = imageUrl;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-password");

        return {
            success: true,
            message: "Profile updated successfully",
            user: updatedUser,
        };
    }

    // ================= EMAIL CHANGE FLOW =================

    const emailExists = await User.findOne({ email, _id: { $ne: userId } });
    if (emailExists) throw new Error("This email is already registered");

    const otpCode = generateOTP();

    const pendingProfileData = {
        name: name || user.name,
        phone: phone || user.phone,
        email,
    };

    if (user.profilePicture !== undefined) pendingProfileData.profilePicture = imageUrl;
    if (user.image !== undefined) pendingProfileData.image = imageUrl;

    await User.findByIdAndUpdate(userId, {
        pendingEmailUpdate: email,
        pendingProfileData,
    });

    await OTP.findOneAndUpdate(
        { email, purpose: "EMAIL_CHANGE" },
        {
            otp: otpCode,
            userId,
            isUsed: false,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
        { upsert: true, new: true }
    );

    await sendOTPEmail({ email, otp: otpCode, purpose: "EMAIL_CHANGE" });

    return {
        success: true,
        requiresVerification: true,
        flow: "email_change",
        tempEmail: email,
    };
};

/**
 * VERIFY EMAIL CHANGE OTP
 */
export const verifyEmailChange = async (userId, email, otp) => {
    const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        purpose: "EMAIL_CHANGE",
        userId,
        isUsed: false,
    });

    if (!otpRecord) throw new Error("Invalid or expired OTP");

    if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new Error("OTP expired");
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new Error("Maximum attempts exceeded");
    }

    if (otpRecord.otp !== otp.toString().trim()) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new Error(`Invalid OTP. ${5 - otpRecord.attempts} attempts remaining`);
    }

    const user = await User.findById(userId);
    if (!user || !user.pendingProfileData) {
        throw new Error("No pending email update found");
    }

    const data = user.pendingProfileData;

    user.name = data.name;
    user.email = data.email;
    user.phone = data.phone;

    if (user.profilePicture !== undefined)
        user.profilePicture = data.profilePicture || data.image;
    if (user.image !== undefined)
        user.image = data.image || data.profilePicture;

    user.pendingProfileData = null;
    user.pendingEmailUpdate = null;

    await user.save({ validateBeforeSave: false });

    otpRecord.isUsed = true;
    await otpRecord.save();

    return await User.findById(userId).select("-password");
};

/**
 * RESEND EMAIL CHANGE OTP
 */
export const resendEmailChangeOTP = async (userId, email) => {
    const user = await User.findById(userId);

    if (
        !user ||
        user.pendingEmailUpdate !== email.toLowerCase() ||
        !user.pendingProfileData
    ) {
        throw new Error("No active email change request found");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndUpdate(
        { email, purpose: "EMAIL_CHANGE" },
        {
            otp: otpCode,
            userId,
            isUsed: false,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
        { upsert: true, new: true }
    );

    await sendOTPEmail({ email, otp: otpCode, purpose: "EMAIL_CHANGE" });
};

/**
 * CHANGE PASSWORD PROFILE
 */

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new Error("User not found");

  if (user.authSource === "google" || user.isGoogleUser) {
    throw new Error("Password change not allowed for Google users");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
};