import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../userCore/user.model.js";
import userRepo from "../userCore/user.repository.js";
import Wallet from "../wallet/wallet.model.js";
import * as otpService from "../common/otp.service.js";

const handleGoogleAuth = async (profile, referralCode = null) => {
    const email = profile.emails[0].value.toLowerCase();
    const googleId = profile.id;

    let user = await userRepo.findByEmail(email);

    if (!user) {
        let referrer = null;
        if (referralCode && referralCode !== "null" && referralCode !== "undefined") {
            referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        }

        const generatedCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        user = await User.create({
            name: profile.displayName,
            email,
            googleId,
            profilePicture: profile.photos?.[0]?.value || null,
            isEmailVerified: true,
            referralCode: generatedCode,
            referredBy: referrer ? referrer._id : null 
        });

        await Wallet.create({
            userId: user._id,
            balance: referrer ? 50 : 0,
            transactions: referrer ? [{
                amount: 50,
                type: 'credit',
                description: 'Referral Join Bonus (Google)',
                status: 'completed'
            }] : []
        });

        if (referrer) {
            await Wallet.findOneAndUpdate(
                { userId: referrer._id },
                {
                    $inc: { balance: 100 },
                    $push: {
                        transactions: {
                            amount: 100,
                            type: 'credit',
                            description: `Referral Reward: ${user.name} joined via Google`,
                            status: 'completed'
                        }
                    }
                }
            );
            await User.findByIdAndUpdate(referrer._id, { $inc: { referralCount: 1 } });
        }
    } else {
        let needsSave = false;
        if (!user.referralCode) {
            user.referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            needsSave = true;
        }
        if (!user.googleId) {
            user.googleId = googleId;
            needsSave = true;
        }
        if (needsSave) await user.save();
    }

    return user;
};

const verifySignupOTP = async (email, otp, name, password, referralCode) => {
    await otpService.verifyAndConsumeOTP(email, otp, "SIGNUP");

    let referrer = null;
    if (referralCode) {
        referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepo.createUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isEmailVerified: true,
        referredBy: referrer ? referrer._id : null,
    });

    await Wallet.create({
        userId: user._id,
        balance: referrer ? 50 : 0,
        transactions: referrer ? [{
            amount: 50,
            type: 'credit',
            description: 'Referral Signup Bonus',
            status: 'completed'
        }] : []
    });

    if (referrer) {
        await Wallet.findOneAndUpdate(
            { userId: referrer._id },
            {
                $inc: { balance: 100 },
                $push: {
                    transactions: {
                        amount: 100,
                        type: 'credit',
                        description: `Referral Reward: ${user.name} joined`,
                        status: 'completed'
                    }
                }
            }
        );
        await User.findByIdAndUpdate(referrer._id, { $inc: { referralCount: 1 } });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await userRepo.updateRefreshToken(user._id, refreshToken);

    return { accessToken, refreshToken, user };
};

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

export default {
    handleGoogleAuth,
    generateTokens,
    verifySignupOTP
};