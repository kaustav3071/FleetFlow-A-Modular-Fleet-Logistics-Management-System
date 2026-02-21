import Notification from "../models/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────────────────
// GET /api/v1/notifications
// Get notifications for the logged-in user
// ─────────────────────────────────────────────────────────
export const getMyNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { recipient: req.user._id };

    const [notifications, total] = await Promise.all([
        Notification.find(filter)
            .populate("relatedTrip", "origin destination status")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Notification.countDocuments(filter),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Notifications fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/notifications/unread-count
// ─────────────────────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
    });

    res.status(200).json(
        new ApiResponse(200, { count }, "Unread count fetched.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────────────────
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        recipient: req.user._id,
    });

    if (!notification) {
        throw new ApiError(404, "Notification not found.");
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json(
        new ApiResponse(200, { notification }, "Notification marked as read.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/read-all
// Mark all notifications as read for the logged-in user
// ─────────────────────────────────────────────────────────
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json(
        new ApiResponse(200, null, "All notifications marked as read.")
    );
});
