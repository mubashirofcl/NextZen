import Admin from "./admin.model.js";

const findByEmail = (email) =>
  Admin.findOne({ email }).select("+password");

const findById = (adminId) =>
  Admin.findById(adminId).select("-password");

const updateLastLogin = (adminId) =>
  Admin.findByIdAndUpdate(adminId, { lastLoginAt: new Date() });

const updateRefreshToken = (adminId, token) =>
  Admin.findByIdAndUpdate(adminId, { refreshToken: token });

const incrementFailedLogins = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) return null;

  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 10 * 60 * 1000;

  admin.failedLoginAttempts += 1;

  if (admin.failedLoginAttempts >= MAX_ATTEMPTS) {
    admin.lockUntil = new Date(Date.now() + LOCK_DURATION);
    admin.failedLoginAttempts = 0;
  }

  return admin.save();
};

const resetFailedLogins = (adminId) =>
  Admin.findByIdAndUpdate(adminId, {
    failedLoginAttempts: 0,
    lockUntil: null,
  });

export default {
  findByEmail,
  findById,
  updateLastLogin,
  updateRefreshToken,
  incrementFailedLogins,
  resetFailedLogins,
};
