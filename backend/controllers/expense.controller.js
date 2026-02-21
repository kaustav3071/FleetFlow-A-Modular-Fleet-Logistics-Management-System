import Expense from "../models/Expense.model.js";
import Vehicle from "../models/Vehicle.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// POST /api/v1/expenses
export const createExpense = asyncHandler(async (req, res) => {
    const { vehicle: vehicleId, distanceTraveled, costPerKm } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const cost = distanceTraveled * costPerKm;
    const expenseData = { ...req.body, cost, loggedBy: req.user._id };
    if (req.file) expenseData.receipt = req.file.path;

    const expense = await Expense.create(expenseData);

    if (expense.type === "fuel") vehicle.totalFuelCost += cost;
    else if (expense.type === "maintenance") vehicle.totalMaintenanceCost += cost;
    await vehicle.save();

    const populated = await Expense.findById(expense._id)
        .populate("vehicle", "name licensePlate")
        .populate("trip", "origin destination")
        .populate("loggedBy", "name");

    res.status(201).json(new ApiResponse(201, { expense: populated }, "Expense logged successfully."));
});

// GET /api/v1/expenses
export const getExpenses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, vehicle, trip, type, startDate, endDate, sortBy = "date", sortOrder = "desc" } = req.query;
    const filter = {};
    if (vehicle) filter.vehicle = vehicle;
    if (trip) filter.trip = trip;
    if (type) filter.type = type;
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [expenses, total] = await Promise.all([
        Expense.find(filter).populate("vehicle", "name licensePlate").populate("trip", "origin destination").populate("loggedBy", "name").sort(sort).skip(skip).limit(parseInt(limit)),
        Expense.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, { expenses, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } }, "Expenses fetched successfully."));
});

// GET /api/v1/expenses/:id
export const getExpenseById = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id).populate("vehicle", "name licensePlate type").populate("trip", "origin destination status").populate("loggedBy", "name email");
    if (!expense) throw new ApiError(404, "Expense not found.");
    res.status(200).json(new ApiResponse(200, { expense }, "Expense fetched successfully."));
});

// PUT /api/v1/expenses/:id
export const updateExpense = asyncHandler(async (req, res) => {
    const existingExpense = await Expense.findById(req.params.id);
    if (!existingExpense) throw new ApiError(404, "Expense not found.");

    const oldCost = existingExpense.cost;
    const oldType = existingExpense.type;

    const updateData = { ...req.body };
    if (req.file) updateData.receipt = req.file.path;

    const expense = await Expense.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate("vehicle", "name licensePlate")
        .populate("loggedBy", "name");

    // Adjust vehicle cost aggregation if cost or type changed
    const newCost = expense.cost;
    const newType = expense.type;

    if (oldCost !== newCost || oldType !== newType) {
        const vehicle = await Vehicle.findById(expense.vehicle._id || expense.vehicle);
        if (vehicle) {
            // Reverse old cost
            if (oldType === "fuel") vehicle.totalFuelCost -= oldCost;
            else if (oldType === "maintenance") vehicle.totalMaintenanceCost -= oldCost;

            // Apply new cost
            if (newType === "fuel") vehicle.totalFuelCost += newCost;
            else if (newType === "maintenance") vehicle.totalMaintenanceCost += newCost;

            // Ensure no negative values
            vehicle.totalFuelCost = Math.max(0, vehicle.totalFuelCost);
            vehicle.totalMaintenanceCost = Math.max(0, vehicle.totalMaintenanceCost);
            await vehicle.save();
        }
    }

    res.status(200).json(new ApiResponse(200, { expense }, "Expense updated successfully."));
});

// DELETE /api/v1/expenses/:id
export const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) throw new ApiError(404, "Expense not found.");

    // Reverse cost from vehicle totals
    const vehicle = await Vehicle.findById(expense.vehicle);
    if (vehicle) {
        if (expense.type === "fuel") {
            vehicle.totalFuelCost = Math.max(0, vehicle.totalFuelCost - expense.cost);
        } else if (expense.type === "maintenance") {
            vehicle.totalMaintenanceCost = Math.max(0, vehicle.totalMaintenanceCost - expense.cost);
        }
        await vehicle.save();
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Expense deleted successfully."));
});

// GET /api/v1/expenses/vehicle/:vehicleId/summary
export const getVehicleExpenseSummary = asyncHandler(async (req, res) => {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const summary = await Expense.aggregate([
        { $match: { vehicle: vehicle._id } },
        { $group: { _id: "$type", totalCost: { $sum: "$cost" }, count: { $sum: 1 }, avgCost: { $avg: "$cost" }, totalFuelLiters: { $sum: { $ifNull: ["$fuelLiters", 0] } } } },
        { $sort: { totalCost: -1 } },
    ]);

    const totalOperationalCost = summary.reduce((acc, item) => acc + item.totalCost, 0);
    res.status(200).json(new ApiResponse(200, { vehicle: { id: vehicle._id, name: vehicle.name, licensePlate: vehicle.licensePlate }, summary, totalOperationalCost }, "Vehicle expense summary fetched."));
});
