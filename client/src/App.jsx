import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "sonner";

import { fetchUser } from "./store/user/authSlice";
import { fetchAdmin } from "./store/admin/authSlice";

// ===== ROUTE GUARDS =====
import AuthRoute from "./routes/user/AuthRoute";
import UserProtectedRoute from "./routes/user/UserProtectedRoute";
import AdminProtectedRoute from "./routes/admin/AdminProtectedRoute";
import AdminAuthRoute from "./routes/admin/AdminAuthRoute";

// ===== ADMIN =====
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/userManagement";

// ===== USER =====
import UserSignup from "./pages/user/UserSignup";
import UserLogin from "./pages/user/UserLogin";
import OTPVerification from "./pages/user/OTPVerification";
import Home from "./pages/user/Home";
import ForgotPassword from "./pages/user/ForgotPassword";
import ResetPassword from "./pages/user/ResetPassword";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";

// ===== USER PROFILE =====
import ProfileLayout from "./pages/user/ProfileLayout.jsx";
import PersonalInfo from "./components/user/PersonalInfo.jsx";
import ChangePasswordModal from "./components/user/ChangePasswordModal.jsx";
import Addresses from "./components/user/Addresses.jsx";
import MainLayout from "./components/user/MainLayout.jsx";

export const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const userAuth = useSelector((s) => s.userAuth);
  const adminAuth = useSelector((s) => s.adminAuth);

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith("/admin");
    if (!userAuth.user && userAuth.loading !== false) {
      dispatch(fetchUser());
    }
    if (isAdminRoute && !adminAuth.admin && adminAuth.loading !== false) {
      dispatch(fetchAdmin());
    }
  }, [dispatch, userAuth.loading, adminAuth.loading, location.pathname]);

  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <>
      <Toaster
  position="bottom-right"
  containerStyle={{
    top: '80px',
    right: '20px',
    zIndex: 999999, 
  }}
/>

      {isAdminPath ? (
        /* ================= ADMIN SIDE ================= */
        <Routes>
          <Route element={<AdminAuthRoute />}>
            <Route path="/admin/login" element={<AdminLogin />} />
          </Route>
          <Route path="/admin" element={<AdminProtectedRoute />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<UserManagement />} />
          </Route>
        </Routes>
      ) : (
        /* ================= USER SIDE ================= */
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

            <Route element={<AuthRoute />}>
              <Route path="/login" element={<UserLogin />} />
              <Route path="/signup" element={<UserSignup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route path="/verify-otp" element={<OTPVerification />} />

            <Route element={<UserProtectedRoute />}>
              <Route path="/profile" element={<ProfileLayout />}>
                <Route index element={<Navigate to="info" replace />} />
                <Route path="info" element={<PersonalInfo />} />
                <Route path="changePassword" element={<ChangePasswordModal />} />
                <Route path="address" element={<Addresses />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      )}
    </>
  );
};

export default App;