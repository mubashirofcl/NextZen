import express from "express";
import {
    createBrand,
    updateBrand,
    toggleBrandStatus,
    getBrands,
    getBrandsForSelection,
} from "./brand.controller.js";

import adminAuth from "../../../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.use(adminAuth);

router.get('/selection', getBrandsForSelection); 
router.get("/", getBrands);

router.post("/", createBrand);
router.patch("/:id", updateBrand);
router.patch("/:id/toggle", toggleBrandStatus);

export default router;
