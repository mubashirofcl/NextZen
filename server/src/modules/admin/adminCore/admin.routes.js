/// → Route definitions
import express from "express";
import { loginAdmin, logoutAdmin, refreshAdminToken } from "./admin.controller.js";
import { loginAdminValidator } from "./admin.validation.js";
import adminAuth from "../../../middlewares/adminAuth.middleware.js";

import {
  getUsers,
  getStats,
  handleBlock,
  handleUnblock
} from "../userManagement/userManegment.controller.js";


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

router.get("/users", adminAuth, getUsers);
router.get("/users/stats", adminAuth, getStats);
router.patch("/users/:userId/block", adminAuth, handleBlock);
router.patch("/users/:userId/unblock", adminAuth, handleUnblock);


// ================= DASHBOARD ROUTE =================
router.get("/dashboard", adminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin authenticated",
    admin: req.admin,
  });
});

export default router;