import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.model.js";
import dotenv from "dotenv";

dotenv.config();

// Only initialize Google OAuth if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                scope: ["profile", "email"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists with this Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists with same email (registered via email)
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // Link Google account to existing user
                        user.googleId = profile.id;
                        user.isVerified = true;
                        if (!user.avatar && profile.photos[0]?.value) {
                            user.avatar = profile.photos[0].value;
                        }
                        await user.save();
                        return done(null, user);
                    }

                    // Create new user from Google profile
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        avatar: profile.photos[0]?.value || "",
                        isVerified: true,
                        role: "dispatcher", // Default role for Google sign-ups
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );

    console.log("✅ Google OAuth strategy initialized");
} else {
    console.warn("⚠️  Google OAuth not configured — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
}

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
