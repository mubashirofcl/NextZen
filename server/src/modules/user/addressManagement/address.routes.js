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

// GET all addresses
router.get("/", getAddresses);

// CREATE address
router.post(
  "/",
  createAddressSchema,
  createAddress
);

// UPDATE address
router.patch(
  "/:id",
  updateAddressSchema,
  updateAddress
);

// DELETE address
router.delete(
  "/:id",
  addressIdParamSchema,
  deleteAddress
);

// SET DEFAULT address
router.patch(
  "/:id/default",
  addressIdParamSchema,
  setDefaultAddress
);

export default router;
