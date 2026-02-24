import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import authService from "../modules/user/googleAuth/auth.service.js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth environment variables are missing");
}
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // 🟢 FIX: Google returns 'state' in req.query. 
        // Let's add a console log here to verify it's arriving!
        const referralCode = req.query.state || null;
        console.log("📍 Passport captured referral code:", referralCode);

        const user = await authService.handleGoogleAuth(profile, referralCode);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
export default passport;