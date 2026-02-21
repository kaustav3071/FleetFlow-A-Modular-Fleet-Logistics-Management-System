import Trip from "../models/Trip.model.js";
import Vehicle from "../models/Vehicle.model.js";
import Driver from "../models/Driver.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────────────────
// POST /api/v1/trips
// Creates a trip in DRAFT status (no vehicle/driver status change)
// ─────────────────────────────────────────────────────────
export const createTrip = asyncHandler(async (req, res) => {
    const { vehicle: vehicleId, driver: driverId } = req.body;

    // Verify vehicle and driver exist
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const driver = await Driver.findById(driverId);
    if (!driver) throw new ApiError(404, "Driver not found.");

    // Create trip in draft status (no status changes to vehicle/driver yet)
    const trip = await Trip.create({
        ...req.body,
        startOdometer: req.body.startOdometer || vehicle.currentOdometer,
        status: "draft",
        createdBy: req.user._id,
    });

    const populatedTrip = await Trip.findById(trip._id)
        .populate("vehicle", "name licensePlate type")
        .populate("driver", "name licenseNumber")
        .populate("createdBy", "name email");

    res.status(201).json(
        new ApiResponse(201, { trip: populatedTrip }, "Trip created as draft.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/trips/:id/dispatch
// Validates everything and moves draft → dispatched
// ─────────────────────────────────────────────────────────
export const dispatchTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) throw new ApiError(404, "Trip not found.");

    if (trip.status !== "draft") {
        throw new ApiError(400, "Only draft trips can be dispatched.");
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const driver = await Driver.findById(trip.driver);
    if (!driver) throw new ApiError(404, "Driver not found.");

    // ─── Validation: Vehicle availability ──────────────────
    if (vehicle.status !== "available") {
        throw new ApiError(400, `Vehicle '${vehicle.name}' is not available. Current status: ${vehicle.status}`);
    }

    // ─── Validation: Driver availability ───────────────────
    if (driver.status !== "on_duty") {
        throw new ApiError(400, `Driver '${driver.name}' is not available. Current status: ${driver.status}`);
    }

    // ─── Validation: Driver license validity ───────────────
    if (new Date() >= driver.licenseExpiry) {
        throw new ApiError(400, `Driver '${driver.name}' has an expired license. Cannot dispatch trip.`);
    }

    // ─── Validation: Driver license category ───────────────
    if (!driver.licenseCategory.includes(vehicle.type)) {
        throw new ApiError(
            400,
            `Driver '${driver.name}' is not licensed to drive a '${vehicle.type}'. Licensed categories: ${driver.licenseCategory.join(", ")}`
        );
    }

    // ─── Validation: Cargo weight vs capacity ──────────────
    let cargoWeightKg = trip.cargoWeight;
    if (trip.cargoUnit === "tons") cargoWeightKg = trip.cargoWeight * 1000;

    let vehicleCapacityKg = vehicle.maxLoadCapacity;
    if (vehicle.capacityUnit === "tons") vehicleCapacityKg = vehicle.maxLoadCapacity * 1000;

    if (cargoWeightKg > vehicleCapacityKg) {
        throw new ApiError(
            400,
            `Cargo weight (${trip.cargoWeight} ${trip.cargoUnit || "kg"}) exceeds vehicle capacity (${vehicle.maxLoadCapacity} ${vehicle.capacityUnit}). Overload is not permitted.`
        );
    }

    // Dispatch the trip
    trip.status = "dispatched";
    trip.dispatchedAt = new Date();
    trip.startOdometer = vehicle.currentOdometer;
    await trip.save();

    // Update vehicle & driver statuses
    vehicle.status = "on_trip";
    driver.status = "on_trip";
    driver.totalTripsAssigned += 1;

    await Promise.all([vehicle.save(), driver.save()]);

    const populatedTrip = await Trip.findById(trip._id)
        .populate("vehicle", "name licensePlate type")
        .populate("driver", "name licenseNumber")
        .populate("createdBy", "name email");

    res.status(200).json(
        new ApiResponse(200, { trip: populatedTrip }, "Trip dispatched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/trips
// ─────────────────────────────────────────────────────────
export const getTrips = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status,
        vehicle,
        driver,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (vehicle) filter.vehicle = vehicle;
    if (driver) filter.driver = driver;
    if (search) {
        filter.$or = [
            { origin: { $regex: search, $options: "i" } },
            { destination: { $regex: search, $options: "i" } },
            { cargoDescription: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [trips, total] = await Promise.all([
        Trip.find(filter)
            .populate("vehicle", "name licensePlate type")
            .populate("driver", "name licenseNumber")
            .populate("createdBy", "name")
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit)),
        Trip.countDocuments(filter),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            trips,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Trips fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/trips/:id
// ─────────────────────────────────────────────────────────
export const getTripById = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id)
        .populate("vehicle", "name licensePlate type maxLoadCapacity")
        .populate("driver", "name licenseNumber licenseCategory")
        .populate("createdBy", "name email");

    if (!trip) {
        throw new ApiError(404, "Trip not found.");
    }

    res.status(200).json(
        new ApiResponse(200, { trip }, "Trip fetched successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/trips/:id (only draft trips)
// ─────────────────────────────────────────────────────────
export const updateTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        throw new ApiError(404, "Trip not found.");
    }

    if (trip.status !== "draft") {
        throw new ApiError(400, "Can only update trips in 'draft' status. Dispatched trips cannot be edited.");
    }

    // If vehicle or driver changed, verify they exist
    if (req.body.vehicle) {
        const vehicle = await Vehicle.findById(req.body.vehicle);
        if (!vehicle) throw new ApiError(404, "Vehicle not found.");
    }
    if (req.body.driver) {
        const driver = await Driver.findById(req.body.driver);
        if (!driver) throw new ApiError(404, "Driver not found.");
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )
        .populate("vehicle", "name licensePlate")
        .populate("driver", "name licenseNumber");

    res.status(200).json(
        new ApiResponse(200, { trip: updatedTrip }, "Trip updated successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/trips/:id/complete
// ─────────────────────────────────────────────────────────
export const completeTrip = asyncHandler(async (req, res) => {
    const { endOdometer, actualCost, notes } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) throw new ApiError(404, "Trip not found.");

    if (trip.status !== "dispatched") {
        throw new ApiError(400, "Only dispatched trips can be completed.");
    }

    // Update trip
    trip.status = "completed";
    trip.endOdometer = endOdometer;
    trip.completedAt = new Date();
    if (actualCost !== undefined) trip.actualCost = actualCost;
    if (notes) trip.notes = notes;
    await trip.save();

    // Reset vehicle & driver statuses
    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    if (vehicle) {
        vehicle.status = "available";
        vehicle.currentOdometer = endOdometer;
        vehicle.totalTrips += 1;
        vehicle.totalDistanceKm += (endOdometer - trip.startOdometer);
        await vehicle.save();
    }

    if (driver) {
        driver.status = "on_duty";
        driver.totalTripsCompleted += 1;
        await driver.save();
    }

    const populatedTrip = await Trip.findById(trip._id)
        .populate("vehicle", "name licensePlate")
        .populate("driver", "name licenseNumber");

    res.status(200).json(
        new ApiResponse(200, { trip: populatedTrip }, "Trip completed successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/trips/:id/cancel
// ─────────────────────────────────────────────────────────
export const cancelTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) throw new ApiError(404, "Trip not found.");

    if (trip.status === "completed" || trip.status === "cancelled") {
        throw new ApiError(400, `Cannot cancel a trip that is already '${trip.status}'.`);
    }

    const wasDispatched = trip.status === "dispatched";

    trip.status = "cancelled";
    trip.cancelledAt = new Date();
    await trip.save();

    // Only reset vehicle/driver statuses if the trip was dispatched
    if (wasDispatched) {
        const vehicle = await Vehicle.findById(trip.vehicle);
        const driver = await Driver.findById(trip.driver);

        if (vehicle && vehicle.status === "on_trip") {
            vehicle.status = "available";
            await vehicle.save();
        }

        if (driver && driver.status === "on_trip") {
            driver.status = "on_duty";
            await driver.save();
        }
    }

    res.status(200).json(
        new ApiResponse(200, { trip }, "Trip cancelled successfully.")
    );
});

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/trips/:id
// ─────────────────────────────────────────────────────────
export const deleteTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        throw new ApiError(404, "Trip not found.");
    }

    if (trip.status === "dispatched") {
        throw new ApiError(400, "Cannot delete an active trip. Cancel it first.");
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.status(200).json(
        new ApiResponse(200, null, "Trip deleted successfully.")
    );
});
