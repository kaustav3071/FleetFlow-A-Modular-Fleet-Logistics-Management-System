import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";

/**
 * Create a notification for a specific user.
 * @param {Object} options
 * @param {string} options.recipientId - User ID to notify
 * @param {string} options.type - Notification type (trip_created, trip_dispatched, etc.)
 * @param {string} options.title - Short title
 * @param {string} options.message - Detailed message
 * @param {string} [options.relatedTrip] - Trip ID (optional)
 */
export async function createNotification({ recipientId, type, title, message, relatedTrip }) {
    try {
        await Notification.create({
            recipient: recipientId,
            type,
            title,
            message,
            relatedTrip: relatedTrip || undefined,
        });
    } catch (err) {
        console.error("Failed to create notification:", err.message);
    }
}

/**
 * Notify all users with a specific role.
 * @param {Object} options
 * @param {string} options.role - Role to notify (e.g., "dispatcher", "manager")
 * @param {string} options.type - Notification type
 * @param {string} options.title - Short title
 * @param {string} options.message - Detailed message
 * @param {string} [options.relatedTrip] - Trip ID (optional)
 * @param {string} [options.excludeUserId] - User ID to exclude (e.g., the user who triggered the action)
 */
export async function notifyByRole({ role, type, title, message, relatedTrip, excludeUserId }) {
    try {
        const filter = { role, isActive: true };
        if (excludeUserId) {
            filter._id = { $ne: excludeUserId };
        }
        const users = await User.find(filter).select("_id");

        const notifications = users.map((user) => ({
            recipient: user._id,
            type,
            title,
            message,
            relatedTrip: relatedTrip || undefined,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (err) {
        console.error("Failed to notify by role:", err.message);
    }
}
