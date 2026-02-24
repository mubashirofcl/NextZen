import express from "express";
import passport from "../../../config/passport.js";
import { googleCallback, googleFailure } from "./auth.controller.js";

const router = express.Router();

router.get(
  "/google",
  (req, res, next) => {
    const referralCode = req.query.ref ? req.query.ref.toString() : "";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state: referralCode,
    })(req, res, next);
  }
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    })(req, res, next);
  },
  googleCallback
);

router.get("/google/failure", googleFailure);

export default router;