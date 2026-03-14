import express from "express";
import * as dashboardController from "./dashboard.controller.js";
import adminAuth from "../../../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.get("/sales-report", adminAuth, dashboardController.getSalesReport);

router.get("/dashboard-stats", adminAuth, dashboardController.getAdminDashboardStats);

export default router;