import express from "express";
import { handleToggle, getWishlist, clearWishlist } from "./wishlist.controller.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();

router.use(userAuth);

router.get("/", getWishlist);
router.post("/toggle", handleToggle);
router.delete('/clear', clearWishlist);

export default router;
