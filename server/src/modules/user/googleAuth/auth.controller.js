import authService from "./auth.service.js";
import userRepo from "../userCore/user.repository.js";

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
      );
    }

    const user = req.user;

    if (user.isBlocked) {
      res.clearCookie("userAccessToken", COOKIE_OPTIONS);
      res.clearCookie("userRefreshToken", COOKIE_OPTIONS);

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?blocked=true&reason=${encodeURIComponent(
          user.blockReason || "Your account has been blocked"
        )}`
      );
    }

    const { accessToken, refreshToken } =
      authService.generateTokens(user._id);

    await userRepo.updateRefreshToken(user._id, refreshToken);

    res.cookie("userAccessToken", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch {
    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

export const googleFailure = (req, res) => {
  return res.redirect(
    `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  );
};
