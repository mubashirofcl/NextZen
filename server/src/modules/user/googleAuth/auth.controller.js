import authService from "./auth.service.js";
import userRepo from "../userCore/user.repository.js";
import User from "../userCore/user.model.js";
import Wallet from "../wallet/wallet.model.js"; 

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,   
  sameSite: "none", 
  path: "/",
};

export const googleCallback = async (req, res, next) => {
  try {

    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
    }

    const user = req.user;

    if (user.isBlocked) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?blocked=true`);
    }

    const { accessToken, refreshToken } = authService.generateTokens(user._id);

    await userRepo.updateRefreshToken(user._id, refreshToken);

    res.cookie("userAccessToken", accessToken, COOKIE_OPTIONS);
    res.cookie("userRefreshToken", refreshToken, COOKIE_OPTIONS);

    return res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (error) {
    if (typeof next === "function") return next(error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

export const googleFailure = (req, res) => {
  return res.redirect(
    `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  );
};
