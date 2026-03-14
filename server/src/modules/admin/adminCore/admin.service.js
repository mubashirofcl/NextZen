import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import adminRepo from "./admin.repository.js";

const loginAdmin = async (email, password) => {
  const admin = await adminRepo.findByEmail(email.toLowerCase());
  if (!admin) throw new Error("Invalid credentials");

  if (admin.lockUntil && admin.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
    throw new Error(`Account locked. Try again in ${minutesLeft} minutes`);
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    await adminRepo.incrementFailedLogins(admin._id);
    throw new Error("Invalid credentials");
  }

  await adminRepo.resetFailedLogins(admin._id);
  await adminRepo.updateLastLogin(admin._id);

  const accessToken = jwt.sign(
    { adminId: admin._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { adminId: admin._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await adminRepo.updateRefreshToken(admin._id, refreshToken);

  return { accessToken, refreshToken };
};

export default { loginAdmin };
