import Maintenance from "../models/Maintenance.model.js";
import Vehicle from "../models/Vehicle.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────────────────
// POST /api/v1/maintenance
// ─────────────────────────────────────────────────────────
export const createMaintenanceLog = asyncHandler(async (req, res) => {
    const { vehicle: vehicleId } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    if (vehicle.status === "on_trip") {
        throw new ApiError(400, "Cannot add maintenance for a vehicle currently on a trip.");
    }

    // Create maintenance log
    const maintenance = await Maintenance.create({
        ...req.body,
        odometerAtService: req.body.odometerAtService || vehicle.currentOdometer,
        loggedBy: req.user._id,
    });

    // Auto-set vehicle status to "in_shop"
    vehicle.status = "in_shop";
    await vehicle.save();

    const populatedLog = await Maintenance.findById(maintenance._id)
        .populate("vehicle", "name licensePlate")
        .populate("loggedBy", "name");

    res.status(201).json(
        new ApiResponse(201, { maintenance: populatedLog }, "Maintenance log created. Vehicle status set to 'In Shop'.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/maintenance
// ─────────────────────────────────────────────────────────
export const getMaintenanceLogs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        vehicle,
        status,
        serviceType,
        sortBy = "serviceDate",
        sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [logs, total] = await Promise.all([
        Maintenance.find(filter)
            .populate("vehicle", "name licensePlate type")
            .populate("loggedBy", "name")
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Maintenance.countDocuments(filter),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Maintenance logs fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/maintenance/:id
// ─────────────────────────────────────────────────────────
export const getMaintenanceById = asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id)
        .populate("vehicle", "name licensePlate type")
        .populate("loggedBy", "name email");

    if (!maintenance) {
        throw new ApiError(404, "Maintenance log not found.");
    }

    res.status(200).json(
        new ApiResponse(200, { maintenance }, "Maintenance log fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/maintenance/:id
// ─────────────────────────────────────────────────────────
export const updateMaintenanceLog = asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
        throw new ApiError(404, "Maintenance log not found.");
    }

    if (maintenance.status === "completed") {
        throw new ApiError(400, "Cannot update a completed maintenance log.");
    }

    const updated = await Maintenance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
        .populate("vehicle", "name licensePlate")
        .populate("loggedBy", "name");

    res.status(200).json(
        new ApiResponse(200, { maintenance: updated }, "Maintenance log updated successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/maintenance/:id/complete
// ─────────────────────────────────────────────────────────
export const completeMaintenanceLog = asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
        throw new ApiError(404, "Maintenance log not found.");
    }

    if (maintenance.status === "completed") {
        throw new ApiError(400, "Maintenance log is already completed.");
    }

    // Complete the maintenance
    maintenance.status = "completed";
    maintenance.completedDate = new Date();
    await maintenance.save();

    // Only set vehicle back to available if no other active maintenance exists
    const vehicle = await Vehicle.findById(maintenance.vehicle);
    if (vehicle) {
        const otherActiveMaintenance = await Maintenance.countDocuments({
            vehicle: vehicle._id,
            status: "in_progress",
            _id: { $ne: maintenance._id },
        });

        if (otherActiveMaintenance === 0) {
            vehicle.status = "available";
        }
        vehicle.totalMaintenanceCost += maintenance.cost;
        await vehicle.save();
    }

    const populatedLog = await Maintenance.findById(maintenance._id)
        .populate("vehicle", "name licensePlate status")
        .populate("loggedBy", "name");

    res.status(200).json(
        new ApiResponse(200, { maintenance: populatedLog }, "Maintenance completed. Vehicle is now available.")
    );
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/maintenance/:id
// ─────────────────────────────────────────────────────────
export const deleteMaintenanceLog = asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
        throw new ApiError(404, "Maintenance log not found.");
    }

    // If deleting an in-progress maintenance, check if vehicle should become available
    if (maintenance.status === "in_progress") {
        const vehicle = await Vehicle.findById(maintenance.vehicle);
        if (vehicle && vehicle.status === "in_shop") {
            const otherActiveMaintenance = await Maintenance.countDocuments({
                vehicle: vehicle._id,
                status: "in_progress",
                _id: { $ne: maintenance._id },
            });

            if (otherActiveMaintenance === 0) {
                vehicle.status = "available";
                await vehicle.save();
            }
        }
    }

    await Maintenance.findByIdAndDelete(req.params.id);

    res.status(200).json(
        new ApiResponse(200, null, "Maintenance log deleted successfully.")
    );
});
