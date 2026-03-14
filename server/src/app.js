import express from "express";
import cors from "cors";

import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import morganMiddleware from "./middlewares/morgan.middleware.js";

import adminRoutes from "./modules/admin/adminCore/admin.routes.js";
import userRoutes from "./modules/user/userCore/user.routes.js";
import profileRoutes from "./modules/user/profile/profile.routes.js";
import authRoutes from "./modules/user/googleAuth/auth.routes.js";
import addressRoutes from "./modules/user/address/address.routes.js";
import categoryRoutes from "./modules/admin/categorieManagement/category.routes.js";
import productRoutes from "./modules/admin/productManagement/product.routes.js";
import brandRoutes from "./modules/admin/brandManagement/brand.routes.js";
import adminOrderRoutes from "./modules/admin/orderManagement/order.routes.js";
import couponRoutes from './modules/admin/couponManagement/coupon.routes.js';
import offerRoutes from './modules/admin/offerManagement/offer.routes.js';
import dashboardRoutes from "./modules/admin/dashboard/dashboard.routes.js";

import productListRoutes from "./modules/user/productListing/product.routes.js"
import userCategoryRoutes from "./modules/user/category/category.routes.js";
import userBrandRoutes from "./modules/user/brand/brand.routes.js";
import cartRoutes from "./modules/user/cart/cart.routes.js";
import wishlistRoutes from "./modules/user/Wishlist/wishlist.routes.js";
import orderRoutes from "./modules/user/order/order.routes.js";
import paymentRoutes from "./modules/user/payment/payment.routes.js";
import walletRoutes from './modules/user/wallet/wallet.routes.js';
import chatbotRoutes from "./modules/user/chatbot/chatbot.routes.js";

const app = express();

app.use(cors({
  origin: ["https://nextzen.mubashiir.in", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

app.use(cookieParser());
app.use(morganMiddleware);
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.disable("etag");
app.use(passport.initialize());

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

//  ADMIN ROUTES 
app.use("/api/admin", adminRoutes);

app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin", productRoutes);
app.use("/api/admin/brands", brandRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/admin/offers', offerRoutes)
app.use("/api/admin", dashboardRoutes);


//  USER ROUTES 
app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users/profile", profileRoutes);
app.use("/api/users/addresses", addressRoutes);
app.use("/api/products", productListRoutes);
app.use("/api/categories", userCategoryRoutes);
app.use("/api/brands", userBrandRoutes);
app.use("/api/user/cart", cartRoutes);
app.use("/api/user/wishlist", wishlistRoutes);
app.use("/api/users/orders", (req, res, next) => {
  next();
}, orderRoutes);
app.use("/api/user/payment", paymentRoutes);
app.use('/api/users/wallet', walletRoutes);
app.use('/api/users/coupons', couponRoutes);
app.use("/api/user/chatbot", chatbotRoutes);



app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export { app };
export default app;