import express from "express";
import passport from "../../../config/passport.js";
import { googleCallback, googleFailure } from "./auth.controller.js";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "openid"], 
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleCallback
);

router.get("/google/failure", googleFailure);

export default router;