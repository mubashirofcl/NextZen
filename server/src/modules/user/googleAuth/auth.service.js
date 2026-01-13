import jwt from "jsonwebtoken";
import User from "../userAuth/user.model.js";
import userRepo from "../userAuth/user.repository.js";
import crypto from "crypto";

const handleGoogleAuth = async (profile) => {
    const email = profile.emails[0].value.toLowerCase();
    const googleId = profile.id;

    let user = await userRepo.findByEmail(email);

    if (!user) {
        return await User.create({
            name: profile.displayName,
            email,
            googleId,
            profilePicture: profile.photos?.[0]?.value || null,
            authSource: "google",
            isGoogleUser: true,
            isEmailVerified: true,
        });
    }

    if (!user.googleId) {
        user.googleId = googleId;
    }

    if (!user.authSource) {
        user.authSource = "google";
    }

    if (user.isGoogleUser !== true) {
        user.isGoogleUser = true;
    }

    await user.save();
    return user;
};


const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};

export default {
    handleGoogleAuth,
    generateTokens,
};