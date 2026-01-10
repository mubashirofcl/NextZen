import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";

import adminRoutes from "./modules/admin/adminAuth/admin.routes.js";
import userRoutes from "./modules/user/userAuth/user.routes.js";
import profileRoutes from "./modules/user/profileManagement/profile.routes.js";
import authRoutes from "./modules/user/googleAuth/auth.routes.js";
import addressRoutes from "./modules/user/addressManagement/address.routes.js";


const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.disable("etag");
app.use(passport.initialize());

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use("/api/admin", adminRoutes);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/users/profile", profileRoutes);
app.use("/api/users/profile", profileRoutes);

app.use("/api/users/addresses", addressRoutes);

export { app };
export default app;
