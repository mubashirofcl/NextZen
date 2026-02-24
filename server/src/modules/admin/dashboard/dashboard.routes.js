import express from "express";
import * as dashboardController from "./dashboard.controller.js";
import adminAuth from "../../../middlewares/adminAuth.middleware.js";

const router = express.Router();

// 🟢 Route for the Sales Report page
router.get("/sales-report", adminAuth, dashboardController.getSalesReport);

// 🟢 Route for the Main Dashboard landing page
router.get("/dashboard-stats", adminAuth, dashboardController.getAdminDashboardStats);

export default router;