import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { register, verifyEmail, login, googleCallback, refreshToken, logout, forgotPassword, resetPassword, getMe, updateProfile, changePassword } from "../controllers/auth.controller.js";
import passport from "../config/passport.js";

const router = Router();

// ─── Public Routes ───────────────────────────────────────
router.post("/register", validate(registerSchema), register);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);
router.post("/refresh-token", refreshToken);

// ─── Protected Routes ────────────────────────────────────
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

// ─── Google OAuth ────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
    router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` }), googleCallback);
}

export default router;
