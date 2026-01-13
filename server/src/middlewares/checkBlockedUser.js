import User from "../modules/user/userAuth/user.model.js";

const checkBlockedUser = async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.isBlocked) {
    res.clearCookie("userAccessToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    res.clearCookie("userRefreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res.status(403).json({
      blocked: true,
      reason: user.blockReason || "Your account has been blocked",
    });
  }

  next();
};

export default checkBlockedUser;
