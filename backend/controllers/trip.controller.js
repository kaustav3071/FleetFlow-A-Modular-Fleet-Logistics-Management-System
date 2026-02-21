import Trip from "../models/Trip.model.js";
import Vehicle from "../models/Vehicle.model.js";
import Driver from "../models/Driver.model.js";
import Expense from "../models/Expense.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification, notifyByRole } from "../utils/createNotification.js";

// ─────────────────────────────────────────────────────────
// POST /api/v1/trips
// Manager creates → draft (no driver needed, notifies dispatchers)
// Dispatcher creates → dispatched (must include driver)
// ─────────────────────────────────────────────────────────
export const createTrip = asyncHandler(async (req, res) => {
    const { vehicle: vehicleId, driver: driverId } = req.body;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const isDispatcher = req.user.role === "dispatcher";
    const initialStatus = isDispatcher ? "dispatched" : "draft";

    let driver = null;

    // If dispatcher is creating → driver is mandatory + full dispatch validations
    if (isDispatcher) {
        if (!driverId) {
            throw new ApiError(400, "Driver is required when creating a dispatched trip.");
        }
        driver = await Driver.findById(driverId);
        if (!driver) throw new ApiError(404, "Driver not found.");

        if (vehicle.status !== "available") {
            throw new ApiError(400, `Vehicle '${vehicle.name}' is not available. Current status: ${vehicle.status}`);
        }
        if (driver.status !== "on_duty") {
            throw new ApiError(400, `Driver '${driver.name}' is not available. Current status: ${driver.status}`);
        }
        if (new Date() >= driver.licenseExpiry) {
            throw new ApiError(400, `Driver '${driver.name}' has an expired license.`);
        }
        if (!driver.licenseCategory.includes(vehicle.type)) {
            throw new ApiError(400, `Driver '${driver.name}' is not licensed for '${vehicle.type}'.`);
        }
    }

    // Manager may optionally provide a driver for the draft
    if (!isDispatcher && driverId) {
        driver = await Driver.findById(driverId);
        if (!driver) throw new ApiError(404, "Driver not found.");
    }

    // Build trip data
    const tripData = {
        ...req.body,
        startOdometer: req.body.startOdometer || vehicle.currentOdometer,
        status: initialStatus,
        dispatchedAt: isDispatcher ? new Date() : undefined,
        createdBy: req.user._id,
    };
    // Only set driver if provided
    if (driver) {
        tripData.driver = driver._id;
    } else {
        delete tripData.driver;
    }

    const trip = await Trip.create(tripData);

    // If dispatcher created → update vehicle & driver statuses
    if (isDispatcher) {
        vehicle.status = "on_trip";
        driver.status = "on_trip";
        driver.totalTripsAssigned += 1;
        await Promise.all([vehicle.save(), driver.save()]);
    }

    const populatedTrip = await Trip.findById(trip._id)
        .populate("vehicle", "name licensePlate type")
        .populate("driver", "name licenseNumber")
        .populate("createdBy", "name email");

    // ─── Notifications ───────────────────────────────────
    if (initialStatus === "draft") {
        // Notify all dispatchers about new trip request
        await notifyByRole({
            role: "dispatcher",
            type: "trip_created",
            title: "New Trip Request",
            message: `New trip from ${trip.origin} to ${trip.destination} created by ${req.user.name}. Assign a driver and dispatch it.`,
            relatedTrip: trip._id,
        });
    } else {
        // Notify the assigned driver
        // Find the User that corresponds to this driver (match by email)
        await notifyByRole({
            role: "dispatcher",
            type: "trip_dispatched",
            title: "Trip Dispatched",
            message: `Trip from ${trip.origin} to ${trip.destination} has been dispatched with driver ${driver.name}.`,
            relatedTrip: trip._id,
            excludeUserId: req.user._id.toString(),
        });
        await notifyByRole({
            role: "manager",
            type: "trip_dispatched",
            title: "Trip Dispatched",
            message: `Dispatcher ${req.user.name} dispatched a trip from ${trip.origin} to ${trip.destination} with driver ${driver.name}.`,
            relatedTrip: trip._id,
        });
    }

    res.status(201).json(
        new ApiResponse(201, { trip: populatedTrip }, `Trip created as '${initialStatus}'.`)
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/trips/:id/dispatch
// Dispatcher assigns a driver and moves draft → dispatched
// ─────────────────────────────────────────────────────────
export const dispatchTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) throw new ApiError(404, "Trip not found.");

    if (trip.status !== "draft") {
        throw new ApiError(400, "Only draft trips can be dispatched.");
    }

    // Accept driver from request body (dispatcher assigns the driver here)
    const driverId = req.body.driver || trip.driver;
    if (!driverId) {
        throw new ApiError(400, "A driver must be assigned to dispatch this trip.");
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const driver = await Driver.findById(driverId);
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
    trip.driver = driver._id; // assign/update driver
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

    // ─── Notifications: Notify managers & the assigned driver ──
    await notifyByRole({
        role: "manager",
        type: "trip_dispatched",
        title: "Trip Dispatched",
        message: `Trip from ${trip.origin} to ${trip.destination} dispatched by ${req.user.name}. Driver: ${driver.name}, Vehicle: ${vehicle.name}.`,
        relatedTrip: trip._id,
    });

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
// Driver/Dispatcher/Manager enters endOdometer → auto-create fuel expense
// ─────────────────────────────────────────────────────────
export const completeTrip = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { endOdometer } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) throw new ApiError(404, "Trip not found.");

    if (trip.status !== "dispatched") {
        throw new ApiError(400, "Only dispatched trips can be completed.");
    }

    if (!endOdometer || endOdometer <= trip.startOdometer) {
        throw new ApiError(400, `End odometer (${endOdometer}) must be greater than start odometer (${trip.startOdometer}).`);
    }

    // Calculate distance
    const distanceTraveled = endOdometer - trip.startOdometer;

    // Get vehicle for fuel cost calculation
    const vehicle = await Vehicle.findById(trip.vehicle);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const costPerKm = vehicle.fuelCostPerKm || 10;
    const fuelExpense = distanceTraveled * costPerKm;

    // ─── Update trip ──────────────────────────────────────
    trip.status = "completed";
    trip.endOdometer = endOdometer;
    trip.completedAt = new Date();
    trip.actualCost = fuelExpense;
    await trip.save();

    // ─── Update vehicle ───────────────────────────────────
    vehicle.status = "available";
    vehicle.currentOdometer = endOdometer;
    vehicle.totalTrips += 1;
    vehicle.totalDistanceKm += distanceTraveled;
    vehicle.totalFuelCost += fuelExpense;
    await vehicle.save();

    // ─── Update driver ────────────────────────────────────
    const driver = await Driver.findById(trip.driver);
    if (driver) {
        driver.status = "on_duty";
        driver.totalTripsCompleted += 1;
        await driver.save();
    }

    // ─── Auto-create fuel expense record ──────────────────
    await Expense.create({
        vehicle: trip.vehicle,
        trip: trip._id,
        type: "fuel",
        cost: fuelExpense,
        date: new Date(),
        description: `Auto-generated fuel expense for trip ${trip.origin} → ${trip.destination}. Distance: ${distanceTraveled} km @ ₹${costPerKm}/km.`,
        loggedBy: req.user._id,
    });

    // ─── Notifications ────────────────────────────────────
    await notifyByRole({
        role: "manager",
        type: "trip_completed",
        title: "Trip Completed",
        message: `Trip from ${trip.origin} to ${trip.destination} completed. Distance: ${distanceTraveled} km. Fuel cost: ₹${fuelExpense}.`,
        relatedTrip: trip._id,
    });
    await notifyByRole({
        role: "dispatcher",
        type: "trip_completed",
        title: "Trip Completed",
        message: `Trip from ${trip.origin} to ${trip.destination} completed by ${driver?.name || "driver"}. Distance: ${distanceTraveled} km.`,
        relatedTrip: trip._id,
    });

    const populatedTrip = await Trip.findById(trip._id)
        .populate("vehicle", "name licensePlate type")
        .populate("driver", "name licenseNumber")
        .populate("createdBy", "name email");

    res.status(200).json(
        new ApiResponse(200, {
            trip: populatedTrip,
            fuelExpense: {
                distanceTraveled,
                costPerKm,
                totalFuelCost: fuelExpense,
            },
        }, "Trip completed successfully. Fuel expense auto-created.")
    );
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/trips/:id/cancel
// Manager or Dispatcher can cancel. Notifies relevant roles.
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

    // ─── Notifications ────────────────────────────────────
    // Notify managers (if cancelled by dispatcher)
    if (req.user.role === "dispatcher") {
        await notifyByRole({
            role: "manager",
            type: "trip_cancelled",
            title: "Trip Cancelled",
            message: `Dispatcher ${req.user.name} cancelled trip from ${trip.origin} to ${trip.destination}.`,
            relatedTrip: trip._id,
        });
    }
    // Notify dispatchers (if cancelled by manager)
    if (req.user.role === "manager") {
        await notifyByRole({
            role: "dispatcher",
            type: "trip_cancelled",
            title: "Trip Cancelled",
            message: `Manager ${req.user.name} cancelled trip from ${trip.origin} to ${trip.destination}.`,
            relatedTrip: trip._id,
        });
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

// ─────────────────────────────────────────────────────────
// GET /api/v1/trips/my-trips
// For logged-in drivers — fetch trips assigned to them
// ─────────────────────────────────────────────────────────
export const getMyTrips = asyncHandler(async (req, res) => {
    // Find the Driver record linked to this User
    const driverRecord = await Driver.findOne({ userId: req.user._id });
    if (!driverRecord) {
        throw new ApiError(404, "No driver profile linked to your account.");
    }

    const {
        page = 1,
        limit = 10,
        status,
        sort = "-createdAt",
    } = req.query;

    const filter = { driver: driverRecord._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith("-") ? -1 : 1;

    const [trips, total] = await Promise.all([
        Trip.find(filter)
            .populate("vehicle", "name type registrationNumber")
            .populate("driver", "name phone")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit)),
        Trip.countDocuments(filter),
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            trips,
            driver: {
                _id: driverRecord._id,
                name: driverRecord.name,
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Your trips fetched successfully.")
    );
});
