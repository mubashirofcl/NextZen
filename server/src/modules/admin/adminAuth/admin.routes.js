/// → Route definitions
import express from "express";
import { loginAdmin, logoutAdmin, refreshAdminToken } from "./admin.controller.js";
import { loginAdminValidator } from "./admin.validation.js";
import adminAuth from "../../../middlewares/adminAuth.middleware.js";

// NEW IMPORT: Import the User Management Controller
import * as userMgmtController from "../userManegment/userManegment.controller.js";

const router = express.Router();

// ================= AUTH ROUTES =================
router.post("/login", loginAdminValidator, loginAdmin);
router.post("/logout", logoutAdmin);
router.post("/refresh", refreshAdminToken);

router.get("/me", adminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin,
  });
});

// ================= USER MANAGEMENT ROUTES =================

router.get("/users", adminAuth, userMgmtController.getUsers);

router.get("/users/stats", adminAuth, userMgmtController.getStats);

router.patch("/users/:userId/block", adminAuth, userMgmtController.handleBlock);

router.patch("/users/:userId/unblock", adminAuth, userMgmtController.handleUnblock);


// ================= DASHBOARD ROUTE =================
router.get("/dashboard", adminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin authenticated",
    admin: req.admin,
  });
});

export default router;