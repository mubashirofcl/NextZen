import jwt from "jsonwebtoken";
import User from "../modules/user/userCore/user.model.js"; 

const userAuth = async (req, res, next) => {
  const token = req.cookies.userAccessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("isBlocked");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.isBlocked) {
      res.clearCookie("userAccessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
      res.clearCookie("userRefreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });

      return res.status(403).json({
        success: false,
        message: "Account Restricted",
        blocked: true, 
        reason: "Your account has been blocked by the administrator.",
      });
    }

    req.user = { userId: decoded.userId };
    next();
  } catch (error) {

    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

export default userAuth;