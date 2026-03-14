import jwt from "jsonwebtoken";
import User from "../modules/user/userCore/user.model.js"; 

const userAuth = async (req, res, next) => {
  const token = req.cookies.userAccessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🛑 CRITICAL: Fetch User from DB to check real-time status
    // We only select '_id' and 'isBlocked' to keep it fast.
    const user = await User.findById(decoded.userId).select("isBlocked");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // 🔒 INSTANT BLOCK CHECK
    if (user.isBlocked) {
      // 1. Kill the cookie immediately
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

      // 2. Send the specific 403 signal your frontend is waiting for
      return res.status(403).json({
        success: false,
        message: "Account Restricted",
        blocked: true, // <--- This matches your frontend condition!
        reason: "Your account has been blocked by the administrator.",
      });
    }

    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    // ... handle token errors (expired, invalid) as before
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

export default userAuth;