import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ─── Cloudinary Storage for Avatars ──────────────────────
const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "fleetflow/avatars",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill" }],
    },
});

// ─── Cloudinary Storage for Vehicle Images ───────────────
const vehicleStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "fleetflow/vehicles",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 800, height: 600, crop: "fill" }],
    },
});

// ─── Cloudinary Storage for Receipts ─────────────────────
const receiptStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "fleetflow/receipts",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
    },
});

// ─── File Filter ─────────────────────────────────────────
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPG, PNG, WebP, and PDF are allowed."), false);
    }
};

// ─── Upload Middleware Factories ─────────────────────────
export const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("avatar");

export const uploadVehicleImage = multer({
    storage: vehicleStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

export const uploadReceipt = multer({
    storage: receiptStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("receipt");
