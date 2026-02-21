import jwt from "jsonwebtoken";
import redis, { isRedisAvailable } from "../config/redis.js";

/**
 * Generate JWT access token (short-lived)
 */
export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
    );
};

/**
 * Generate JWT refresh token (long-lived) and store in Redis if available
 */
export const generateRefreshToken = async (user) => {
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
    );

    // Store in Redis if available
    if (isRedisAvailable()) {
        await redis.set(`refresh_token:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
    }

    return refreshToken;
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = async (user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    return { accessToken, refreshToken };
};

/**
 * Blacklist a refresh token (on logout)
 */
export const blacklistToken = async (userId) => {
    if (isRedisAvailable()) {
        await redis.del(`refresh_token:${userId}`);
    }
};

/**
 * Verify refresh token against Redis store
 */
export const verifyRefreshToken = async (userId, token) => {
    if (!isRedisAvailable()) {
        // Without Redis, just verify the JWT signature is valid
        return true;
    }
    const storedToken = await redis.get(`refresh_token:${userId}`);
    return storedToken === token;
};

/**
 * Set token cookies on response
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/v1/auth/refresh-token",
    });
};
