import jwt from "jsonwebtoken";
import User from "../userCore/user.model.js";
import userRepo from "../userCore/user.repository.js";

const handleGoogleAuth = async (profile) => {
  const email = profile.emails[0].value.toLowerCase();
  const googleId = profile.id;

  let user = await userRepo.findByEmail(email);

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email,
      googleId,
      profilePicture: profile.photos?.[0]?.value || null,
      isEmailVerified: true,
    });
  } else {
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  }

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
