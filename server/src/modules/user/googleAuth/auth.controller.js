import authService from "./auth.service.js";

export const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`
      );
    }

    const user = req.user;

    // 🔥 BLOCK CHECK — MUST BE BEFORE TOKENS
    if (user.isBlocked) {
      // ensure no cookies exist
      res.clearCookie("userAccessToken");
      res.clearCookie("userRefreshToken");

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?blocked=true&reason=${encodeURIComponent(
          user.blockReason || "Your account has been blocked"
        )}`
      );
    }

    // ✅ ONLY NON-BLOCKED USERS GET TOKENS
    const { accessToken, refreshToken } =
      authService.generateTokens(user._id);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("userAccessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("userRefreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};


export const googleFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
};