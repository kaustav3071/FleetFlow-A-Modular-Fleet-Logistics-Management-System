import Driver from "../models/Driver.model.js";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


// ─────────────────────────────────────────────────────────
// POST /api/v1/drivers
// Auto-creates a User account (role: "driver") for the driver
// ─────────────────────────────────────────────────────────
export const createDriver = asyncHandler(async (req, res) => {
    const driverData = { ...req.body };

    if (req.file) {
        driverData.avatar = req.file.path;
    }

    // Require email for driver (needed for login)
    if (!driverData.email) {
        throw new ApiError(400, "Email is required. It will be used as the driver's login credential.");
    }

    // Check if a User with this email already exists
    const existingUser = await User.findOne({ email: driverData.email });
    if (existingUser) {
        throw new ApiError(409, `A user account with email '${driverData.email}' already exists.`);
    }

    // Use custom password if provided, otherwise default
    const driverPassword = driverData.password || "driver@123";

    // Create the User account
    const userAccount = await User.create({
        name: driverData.name,
        email: driverData.email,
        password: driverPassword,
        role: "driver",
        isVerified: true,
    });

    // Remove password from driver data (it's a User field, not Driver field)
    delete driverData.password;

    // Create the driver and link to User
    const driver = await Driver.create({
        ...driverData,
        userId: userAccount._id,
    });

    res.status(201).json(
        new ApiResponse(201, {
            driver,
            credentials: {
                email: driverData.email,
                password: driverPassword,
            },
        }, "Driver created successfully. Share the login credentials with the driver.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/drivers
// ─────────────────────────────────────────────────────────
export const getDrivers = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        search,
        licenseCategory,
        expiringSoon,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (licenseCategory) filter.licenseCategory = { $in: [licenseCategory] };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { licenseNumber: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    // Filter drivers with licenses expiring within 30 days
    if (expiringSoon === "true") {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        filter.licenseExpiry = { $lte: thirtyDaysFromNow, $gte: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [drivers, total] = await Promise.all([
        Driver.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
        Driver.countDocuments(filter),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            drivers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Drivers fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/drivers/:id
// ─────────────────────────────────────────────────────────
export const getDriverById = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        throw new ApiError(404, "Driver not found.");
    }

    res.status(200).json(
        new ApiResponse(200, { driver }, "Driver fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/drivers/:id
// ─────────────────────────────────────────────────────────
export const updateDriver = asyncHandler(async (req, res) => {
    const updateData = { ...req.body };

    if (req.file) {
        updateData.avatar = req.file.path;
    }

    const driver = await Driver.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!driver) {
        throw new ApiError(404, "Driver not found.");
    }

    res.status(200).json(
        new ApiResponse(200, { driver }, "Driver updated successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/drivers/:id
// ─────────────────────────────────────────────────────────
export const deleteDriver = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        throw new ApiError(404, "Driver not found.");
    }

    if (driver.status === "on_trip") {
        throw new ApiError(400, "Cannot delete a driver who is currently on a trip.");
    }

    // Delete the linked User account if it exists
    if (driver.userId) {
        await User.findByIdAndDelete(driver.userId);
    }

    await Driver.findByIdAndDelete(req.params.id);

    res.status(200).json(
        new ApiResponse(200, null, "Driver deleted successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/drivers/:id/status
// ─────────────────────────────────────────────────────────
export const updateDriverStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["on_duty", "off_duty", "on_trip", "suspended"];

    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        throw new ApiError(404, "Driver not found.");
    }

    // Check license validity before setting to on_duty
    if (status === "on_duty" && new Date() >= driver.licenseExpiry) {
        throw new ApiError(400, "Cannot set driver to 'on_duty'. License has expired.");
    }

    driver.status = status;
    await driver.save();

    res.status(200).json(
        new ApiResponse(200, { driver }, `Driver status updated to '${status}'.`)
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/drivers/available
// ─────────────────────────────────────────────────────────
export const getAvailableDrivers = asyncHandler(async (req, res) => {
    const { vehicleType } = req.query;
    const filter = {
        status: "on_duty",
        licenseExpiry: { $gt: new Date() },
    };

    // Filter by vehicle type they're licensed for
    if (vehicleType) {
        filter.licenseCategory = { $in: [vehicleType] };
    }

    const drivers = await Driver.find(filter).sort({ name: 1 });

    res.status(200).json(
        new ApiResponse(200, { drivers }, "Available drivers fetched successfully.")
    );
});
