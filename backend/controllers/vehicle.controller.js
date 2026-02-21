import Vehicle from "../models/Vehicle.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────────────────
// POST /api/v1/vehicles
// ─────────────────────────────────────────────────────────
export const createVehicle = asyncHandler(async (req, res) => {
    const vehicleData = { ...req.body };

    // If image uploaded via Cloudinary
    if (req.file) {
        vehicleData.image = req.file.path;
    }

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json(
        new ApiResponse(201, { vehicle }, "Vehicle created successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/vehicles
// ─────────────────────────────────────────────────────────
export const getVehicles = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        type,
        region,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (region) filter.region = { $regex: region, $options: "i" };
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { licensePlate: { $regex: search, $options: "i" } },
            { model: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [vehicles, total] = await Promise.all([
        Vehicle.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
        Vehicle.countDocuments(filter),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            vehicles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Vehicles fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/vehicles/:id
// ─────────────────────────────────────────────────────────
export const getVehicleById = asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        throw new ApiError(404, "Vehicle not found.");
    }

    res.status(200).json(
        new ApiResponse(200, { vehicle }, "Vehicle fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/vehicles/:id
// ─────────────────────────────────────────────────────────
export const updateVehicle = asyncHandler(async (req, res) => {
    const updateData = { ...req.body };

    if (req.file) {
        updateData.image = req.file.path;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!vehicle) {
        throw new ApiError(404, "Vehicle not found.");
    }

    res.status(200).json(
        new ApiResponse(200, { vehicle }, "Vehicle updated successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/vehicles/:id
// ─────────────────────────────────────────────────────────
export const deleteVehicle = asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        throw new ApiError(404, "Vehicle not found.");
    }

    if (vehicle.status === "on_trip") {
        throw new ApiError(400, "Cannot delete a vehicle that is currently on a trip.");
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.status(200).json(
        new ApiResponse(200, null, "Vehicle deleted successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/vehicles/:id/status
// ─────────────────────────────────────────────────────────
export const updateVehicleStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["available", "on_trip", "in_shop", "retired"];

    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        throw new ApiError(404, "Vehicle not found.");
    }

    // Prevent transitioning from on_trip to retired directly
    if (vehicle.status === "on_trip" && status === "retired") {
        throw new ApiError(400, "Cannot retire a vehicle that is currently on a trip. Complete or cancel the trip first.");
    }

    vehicle.status = status;
    await vehicle.save();

    res.status(200).json(
        new ApiResponse(200, { vehicle }, `Vehicle status updated to '${status}'.`)
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/vehicles/available
// ─────────────────────────────────────────────────────────
export const getAvailableVehicles = asyncHandler(async (req, res) => {
    const { type } = req.query;
    const filter = { status: "available" };
    if (type) filter.type = type;

    const vehicles = await Vehicle.find(filter).sort({ name: 1 });

    res.status(200).json(
        new ApiResponse(200, { vehicles }, "Available vehicles fetched successfully.")
    );
});
