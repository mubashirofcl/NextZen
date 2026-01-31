import express from "express";
import { getUserBrands } from "./brand.controller.js";

const router = express.Router();
router.get("/", getUserBrands);

export default router;
