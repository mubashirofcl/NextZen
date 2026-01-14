/// → Database operations (CRUD)


import Admin from "./admin.model.js";

const findByEmail = async (email) => {
  return await Admin.findOne({ email }).select('+password');
};

const findById = async (adminId) => {
  return await Admin.findById(adminId).select('-password');
};

const updateLastLogin = async (adminId) => {
  return await Admin.findByIdAndUpdate(
    adminId,
    { lastLoginAt: new Date() },
    { new: true }
  );
};

const incrementFailedLogins = async (adminId) => {
  const admin = await Admin.findById(adminId);

  if (!admin) return null;

  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 10 * 60 * 1000; 
  admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;

  if (admin.failedLoginAttempts >= MAX_ATTEMPTS) {
    admin.lockUntil = new Date(Date.now() + LOCK_DURATION);
    admin.failedLoginAttempts = 0;
  }

  return await admin.save();
};

const resetFailedLogins = async (adminId) => {
  return await Admin.findByIdAndUpdate(
    adminId,
    {
      failedLoginAttempts: 0,
      lockUntil: null
    },
    { new: true }
  );
};

export default {
  findByEmail,
  findById,
  updateLastLogin,
  incrementFailedLogins,
  resetFailedLogins,
};