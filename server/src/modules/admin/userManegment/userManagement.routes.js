import express from "express";
import * as userMgmtController from "./userManegment.controller";

const router = express.Router();

router.get("/stats", userMgmtController.getStats);
router.get("/", userMgmtController.getUsers);
router.patch("/:userId/block", userMgmtController.handleBlock);
router.patch("/:userId/unblock", userMgmtController.handleUnblock);

export default router;