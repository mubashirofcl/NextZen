import express from "express";

import userAuth from "../../../middlewares/userAuth.middleware.js";
import checkBlockedUser from "../../../middlewares/checkBlockedUser.js";

import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from "./address.validation.js";

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./address.controller.js";

const router = express.Router();

// ==================== PROTECTED ADDRESS ROUTES ====================

router.use(userAuth);
router.use(checkBlockedUser);


router.get("/", getAddresses);
router.post("/", createAddressSchema, createAddress);
router.patch("/:id", updateAddressSchema, updateAddress);

router.delete("/:id", addressIdParamSchema, deleteAddress);
router.patch("/:id/default", addressIdParamSchema, setDefaultAddress);

export default router;
