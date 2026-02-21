import ApiError from "../utils/ApiError.js";

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error in development
    if (process.env.NODE_ENV === "development") {
        console.error("❌ Error:", err);
    }

    // ─── Mongoose Bad ObjectId ─────────────────────────────
    if (err.name === "CastError") {
        const message = `Resource not found with id: ${err.value}`;
        error = new ApiError(404, message);
    }

    // ─── Mongoose Duplicate Key ────────────────────────────
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate value for '${field}': '${err.keyValue[field]}'. Please use another value.`;
        error = new ApiError(400, message);
    }

    // ─── Mongoose Validation Error ─────────────────────────
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((val) => val.message);
        const message = messages.join(". ");
        error = new ApiError(400, message);
    }

    // ─── JWT Errors ────────────────────────────────────────
    if (err.name === "JsonWebTokenError") {
        error = new ApiError(401, "Invalid token. Please login again.");
    }

    if (err.name === "TokenExpiredError") {
        error = new ApiError(401, "Token expired. Please login again.");
    }

    // ─── Multer File Size Error ────────────────────────────
    if (err.code === "LIMIT_FILE_SIZE") {
        error = new ApiError(400, "File size exceeds the 5MB limit.");
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
};

export default errorHandler;
