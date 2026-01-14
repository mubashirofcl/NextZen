import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import authService from "../modules/user/googleAuth/auth.service.js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: ['profile', 'email', 'openid'] 
    },
    async (accessToken, refreshToken, profile, done) => {
        try {

            const user = await authService.handleGoogleAuth(profile);
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => done(null, { id }));

export default passport;