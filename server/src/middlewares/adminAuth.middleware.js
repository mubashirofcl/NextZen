import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
  const token = req.cookies?.adminAccessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED", 
    });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { adminId: decoded.adminId };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }
};

export default adminAuth;
