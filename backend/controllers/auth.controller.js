import crypto from "crypto";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    generateTokens,
    blacklistToken,
    verifyRefreshToken,
    setTokenCookies,
    generateAccessToken,
} from "../utils/generateTokens.js";
import sendEmail from "../config/emailQueue.js";
import {
    verificationEmailTemplate,
    resetPasswordEmailTemplate,
} from "../utils/emailTemplates.js";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "An account with this email already exists.");
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role: role || "dispatcher",
        verificationToken: hashedToken,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email via BullMQ
    const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, '');
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;
    await sendEmail({
        to: email,
        subject: "FleetFlow — Verify Your Email Address",
        html: verificationEmailTemplate(name, verificationUrl),
    });

    res.status(201).json(
        new ApiResponse(201, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        }, "Registration successful! Please check your email to verify your account.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/auth/verify-email/:token
// ─────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        verificationToken: hashedToken,
        verificationTokenExpiry: { $gt: Date.now() },
    });
    console.log('[VERIFY EMAIL] User found:', user ? user.email : null);
    if (!user) {
        console.log('[VERIFY EMAIL] Invalid or expired token:', token);
        throw new ApiError(400, "Invalid or expired verification token.");
    }
    // Mark as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    console.log('[VERIFY EMAIL] User updated:', user.email, 'isVerified:', user.isVerified);
    res.status(200).json(
        new ApiResponse(200, null, "Email verified successfully! You can now login.")
    );
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid email or password.");
    }

    // Check if account uses Google OAuth only
    if (!user.password && user.googleId) {
        throw new ApiError(401, "This account uses Google sign-in. Please login with Google.");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password.");
    }

    // Check if email is verified (skip in development)
    if (!user.isVerified && process.env.NODE_ENV === 'production') {
        throw new ApiError(403, "Please verify your email before logging in. Check your inbox for the verification link.");
    }

    // Check if account is active
    if (!user.isActive) {
        throw new ApiError(403, "Your account has been deactivated. Contact an administrator.");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json(
        new ApiResponse(200, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
            accessToken,
            refreshToken,
        }, "Login successful!")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/auth/google/callback
// ─────────────────────────────────────────────────────────
export const googleCallback = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "Google authentication failed.");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Redirect to frontend with token
    res.redirect(
        `${process.env.FRONTEND_URL}/auth/google/success?token=${accessToken}`
    );
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh-token
// ─────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token not provided.");
    }

    try {
        const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // Verify against Redis
        const isValid = await verifyRefreshToken(decoded.id, incomingRefreshToken);
        if (!isValid) {
            throw new ApiError(401, "Refresh token is invalid or expired.");
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            throw new ApiError(401, "User not found.");
        }

        // Generate new access token
        const accessToken = generateAccessToken(user);

        // Set new access token cookie
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
        });

        res.status(200).json(
            new ApiResponse(200, { accessToken }, "Token refreshed successfully.")
        );
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token.");
    }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
    // Blacklist refresh token in Redis
    if (req.user) {
        await blacklistToken(req.user._id);
    }

    // Clear cookies
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", { ...cookieOptions, path: "/api/v1/auth/refresh-token" });

    res.status(200).json(
        new ApiResponse(200, null, "Logged out successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// ─────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
        return res.status(200).json(
            new ApiResponse(200, null, "If an account with that email exists, a password reset link has been sent.")
        );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email via BullMQ
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
        to: email,
        subject: "FleetFlow — Reset Your Password",
        html: resetPasswordEmailTemplate(user.name, resetUrl),
    });

    res.status(200).json(
        new ApiResponse(200, null, "If an account with that email exists, a password reset link has been sent.")
    );
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/reset-password/:token
// ─────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token.");
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    // Blacklist existing refresh tokens
    await blacklistToken(user._id);

    res.status(200).json(
        new ApiResponse(200, null, "Password reset successful! You can now login with your new password.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/auth/me
// ─────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    res.status(200).json(
        new ApiResponse(200, { user }, "User profile fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/auth/profile
// ─────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // If email is changing, check for duplicates
    if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) {
            throw new ApiError(409, "An account with this email already exists.");
        }
        user.email = email;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json(
        new ApiResponse(200, { user }, "Profile updated successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/auth/change-password
// ─────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required.");
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters long.");
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Google OAuth users without password
    if (!user.password && user.googleId) {
        throw new ApiError(400, "This account uses Google sign-in. Password cannot be changed here.");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new ApiError(401, "Current password is incorrect.");
    }

    user.password = newPassword;
    await user.save();

    // Blacklist existing tokens for security
    await blacklistToken(user._id);

    res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully. Please login again.")
    );
});
