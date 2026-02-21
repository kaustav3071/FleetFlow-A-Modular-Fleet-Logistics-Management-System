import Expense from "../models/Expense.model.js";
import Vehicle from "../models/Vehicle.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// POST /api/v1/expenses
export const createExpense = asyncHandler(async (req, res) => {
    const { vehicle: vehicleId } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new ApiError(404, "Vehicle not found.");

    const expenseData = { ...req.body, loggedBy: req.user._id };
    if (req.file) expenseData.receipt = req.file.path;

    const expense = await Expense.create(expenseData);

    if (expense.type === "fuel") vehicle.totalFuelCost += expense.cost;
    else if (expense.type === "maintenance") vehicle.totalMaintenanceCost += expense.cost;
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
    const updateData = { ...req.body };
    if (req.file) updateData.receipt = req.file.path;

    const expense = await Expense.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate("vehicle", "name licensePlate").populate("loggedBy", "name");
    if (!expense) throw new ApiError(404, "Expense not found.");
    res.status(200).json(new ApiResponse(200, { expense }, "Expense updated successfully."));
});

// DELETE /api/v1/expenses/:id
export const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) throw new ApiError(404, "Expense not found.");
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
