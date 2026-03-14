import express from "express";
import { handleToggle, getWishlist, clearWishlist, removeFromWishlist } from "./wishlist.controller.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();

router.use(userAuth);

router.get("/", getWishlist);
router.post("/toggle", handleToggle);
router.delete('/clear', clearWishlist);
router.delete("/remove", removeFromWishlist);

export default router;
