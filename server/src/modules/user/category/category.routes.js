import express from "express";
import { getUserCategories } from "./category.controller.js";
import { getUserSubCategories } from "./category.controller.js";

const router = express.Router();

router.get("/", getUserCategories);
router.get("/sub", getUserSubCategories);

export default router;
