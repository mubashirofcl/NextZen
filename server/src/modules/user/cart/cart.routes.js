import express from "express";
import { addToCart, clearCart, getCart, removeFromCart, updateQuantity, validateCartForCheckout } from "./cart.controller.js";
import userAuth from "../../../middlewares/userAuth.middleware.js";

const router = express.Router();

router.use(userAuth);

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/update/:itemId", updateQuantity);
router.delete("/remove/:itemId", removeFromCart);
router.delete("/clear", clearCart);
router.get("/validate-checkout", validateCartForCheckout);


export default router;