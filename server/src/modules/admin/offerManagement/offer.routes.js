import express from "express";
import * as offerController from "./offer.controller.js";

const router = express.Router();

router.post("/", offerController.createOffer);
router.get("/", offerController.getOffers);
router.get("/available", offerController.getAvailableRules); 
router.get("/:id", offerController.getOfferById);
router.patch("/:id", offerController.updateOffer);
router.delete("/:id", offerController.deleteOffer);
router.patch('/:id/toggle-status', offerController.toggleOfferStatus);

export default router;