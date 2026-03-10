import baseAxios from "../baseAxios";
import userAxios from "./userAxios";

// ==================== SIGNUP ====================
export const requestSignupOTP = (data) =>
  baseAxios.post("/users/signup/request-otp", data);

export const verifySignupOTP = (data) =>
  baseAxios.post("/users/signup/verify-otp", data);

export const resendSignupOTP = (data) =>
  baseAxios.post("/users/signup/resend-otp", data);

// ==================== LOGIN / LOGOUT ====================
export const userLogin = (data) =>
  baseAxios.post("/users/login", data);

export const userLogout = () =>
  userAxios.post("/users/logout");

// ==================== FORGOT PASSWORD ====================
export const requestForgotPassword = (data) =>
  baseAxios.post("/users/forgot-password/request-otp", data);


export const resendForgotPasswordOTP = (data) =>
  baseAxios.post("/users/forgot-password/resend-otp", data);

export const verifyForgotPasswordOTP = (data) =>
  baseAxios.post("/users/forgot-password/verify-otp", data);

export const resetPassword = (data) =>
  baseAxios.post("/users/reset-password", data);

// ==================== USER PROFILE ====================
export const getUserMe = () =>
  userAxios.get("/users/profile/me", { withCredentials: true });

export const updateProfile = async (data) => {
  return await userAxios.put("/users/profile/update", data);
};
export const verifyEmailChange = async (data) => {
  return await userAxios.post("/users/profile/verify-email-change", data);
};

export const resendEmailChangeOTP = async (data) => {
  return await userAxios.post("/users/profile/resend-email-otp", data);
};

export const changePassword = (data) =>
  userAxios.post("/users/profile/change-password", data);

// ==================== AUTH TOKEN ====================
export const refreshUserToken = () =>
  baseAxios.post("/users/refresh");