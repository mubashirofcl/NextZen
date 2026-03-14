import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "./payment.controller.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();

router.post("/create-order", userAuth, createRazorpayOrder);
router.post("/verify-payment", userAuth, verifyRazorpayPayment);

export default router;