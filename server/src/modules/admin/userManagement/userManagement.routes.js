import express from "express";
import { getStats, getUsers, handleBlock, handleUnblock } from "./userManegment.controller";

const router = express.Router();

router.get("/stats", getStats);
router.get("/", getUsers);
router.patch("/:userId/block", handleBlock);
router.patch("/:userId/unblock", handleUnblock);

export default router;