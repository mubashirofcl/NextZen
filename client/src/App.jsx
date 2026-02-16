import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "sonner";

import { fetchUser } from "./store/user/authSlice";
import { fetchAdmin, clearAdmin } from "./store/admin/authSlice";

// ===== ROUTE GUARDS =====
import AuthRoute from "./routes/user/AuthRoute";
import UserProtectedRoute from "./routes/user/UserProtectedRoute";
import AdminProtectedRoute from "./routes/admin/AdminProtectedRoute";
import AdminAuthRoute from "./routes/admin/AdminAuthRoute";

// ===== ADMIN =====
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/userManagement.jsx";
import CategoryManagement from "./pages/admin/CategoryManagement.jsx";

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
import ProductManagement from "./pages/admin/ProductManagement.jsx";
import ProductForm from "./pages/admin/ProductForm.jsx";
import BrandManagement from "./pages/admin/BrandManagement.jsx";
import Shop from "./pages/user/Shop.jsx";
import ProductDetails from "./pages/user/ProductDetails.jsx";
import CartPage from "./pages/user/CartPage.jsx";
import WishlistPage from "./pages/user/WishlistPage.jsx";
import CheckoutPage from './pages/user/CheckoutPage';
import OrderHistory from "./pages/user/OrderHistory.jsx";
import OrderDetailPage from "./pages/user/OrderDetailPage.jsx";
import AdminOrderListing from "./pages/admin/AdminOrderListing.jsx";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail.jsx";
import AdminReturnRequests from "./pages/admin/AdminReturnRequests.jsx";
import OrderStatusPage from "./components/user/OrderStatusPage.jsx";
import WalletDashboard from "./pages/user/WalletDashboard.jsx";



export const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const userAuth = useSelector((s) => s.userAuth);
  const adminAuth = useSelector((s) => s.adminAuth);

  const isAdminPath = location.pathname.startsWith("/admin");

  // 1. INITIAL SESSION FETCH
  useEffect(() => {
    // Fetch User session if not already loaded
    if (userAuth.loading) {
      dispatch(fetchUser());
    }

    // Fetch Admin session only if on admin path and not already loaded
    if (isAdminPath && adminAuth.loading) {
      dispatch(fetchAdmin());
    }
  }, [dispatch, isAdminPath]); // Minimal dependencies to prevent re-fetch loops

  // 2. GLOBAL AUTH EVENT LISTENERS
  useEffect(() => {
    const handleAdminLogout = () => {
      dispatch(clearAdmin());
      if (location.pathname.startsWith("/admin")) {
        navigate("/admin/login");
      }
    };

    window.addEventListener("ADMIN_LOGOUT", handleAdminLogout);
    return () => window.removeEventListener("ADMIN_LOGOUT", handleAdminLogout);
  }, [dispatch, navigate, location.pathname]);

  // 3. GLOBAL LOADING STATE (STOPS THE "STUCK" ISSUE)
  if (isAdminPath && adminAuth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#7a6af6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verifying Admin Identity</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '1rem',
            border: '1px solid #f1f5f9',
            boxShadow: '0 10px 1px -3px rgba(0,0,0,0.05)',
          },
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
            <Route path="category" element={<CategoryManagement />} />
            <Route path="brand" element={<BrandManagement />} />

            {/* PRODUCTS */}
            <Route path="products">
              <Route index element={<ProductManagement />} />
              <Route path="add" element={<ProductForm />} />
              <Route path="edit/:id" element={<ProductForm />} />
            </Route>

            {/* --- 📦 ORDER MANAGEMENT --- */}
            <Route path="orders">
              <Route index element={<AdminOrderListing />} />
              <Route path=":id" element={<AdminOrderDetail />} />
              <Route path="returns" element={<AdminReturnRequests />} />
            </Route>

          </Route>

          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>

      ) : (
        /* ================= USER SIDE ================= */
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />

            <Route element={<AuthRoute />}>
              <Route path="/login" element={<UserLogin />} />
              <Route path="/signup" element={<UserSignup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route path="/verify-otp" element={<OTPVerification />} />

            <Route element={<UserProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              <Route path="/checkout/success/:orderId" element={<OrderStatusPage type="success" />} />
              <Route path="/payment-failed" element={<OrderStatusPage type="failed" />} />
              <Route path="/payment-failed/:orderId" element={<OrderStatusPage type="failed" />} />

              <Route path="/profile" element={<ProfileLayout />}>
                <Route index element={<Navigate to="info" replace />} />
                <Route path="info" element={<PersonalInfo />} />
                <Route path="changePassword" element={<ChangePasswordModal />} />
                <Route path="address" element={<Addresses />} />

                <Route path="orders" element={<OrderHistory />} />
                <Route path="orders/:orderId" element={<OrderDetailPage />} />

                <Route path="wallet" element={<WalletDashboard />} />
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