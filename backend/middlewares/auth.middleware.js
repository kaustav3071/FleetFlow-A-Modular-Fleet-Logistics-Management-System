import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Protect routes — verify JWT access token
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check Authorization header first, then cookies
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new ApiError(401, "Not authorized. Please login.");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const user = await User.findById(decoded.id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "User not found. Token is invalid.");
        }

        if (!user.isActive) {
            throw new ApiError(403, "Your account has been deactivated.");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token. Please login again.");
        }
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token expired. Please refresh your session.");
        }
        throw error;
    }
});

/**
 * Role-Based Access Control (RBAC) middleware
 * Usage: authorize("manager", "dispatcher")
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Not authorized. Please login.");
        }

        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Role '${req.user.role}' is not authorized to access this resource. Required: ${roles.join(", ")}`
            );
        }

        next();
    };
};
