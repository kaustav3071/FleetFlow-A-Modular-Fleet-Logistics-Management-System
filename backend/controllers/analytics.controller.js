import Vehicle from "../models/Vehicle.model.js";
import Driver from "../models/Driver.model.js";
import Trip from "../models/Trip.model.js";
import Expense from "../models/Expense.model.js";
import Maintenance from "../models/Maintenance.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

// GET /api/v1/analytics/dashboard
export const getDashboardKPIs = asyncHandler(async (req, res) => {
    const [vehicleCounts, driverCounts, tripCounts, recentTrips, maintenanceAlerts, avgFuelCostData] = await Promise.all([
        Vehicle.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Driver.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Trip.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Trip.find().sort({ createdAt: -1 }).limit(5).populate("vehicle", "name").populate("driver", "name"),
        // Vehicles currently in maintenance + count of in_progress maintenance logs
        Maintenance.countDocuments({ status: "in_progress" }),
        // Average fuel cost per km across the fleet
        Vehicle.aggregate([
            { $match: { totalDistanceKm: { $gt: 0 }, totalFuelCost: { $gt: 0 } } },
            { $group: { _id: null, totalDistance: { $sum: "$totalDistanceKm" }, totalFuelCost: { $sum: "$totalFuelCost" } } },
        ]),
    ]);

    const totalVehicles = vehicleCounts.reduce((sum, v) => sum + v.count, 0);
    const availableVehicles = vehicleCounts.find(v => v._id === "available")?.count || 0;
    const onTripVehicles = vehicleCounts.find(v => v._id === "on_trip")?.count || 0;
    const inShopVehicles = vehicleCounts.find(v => v._id === "in_shop")?.count || 0;
    const retiredVehicles = vehicleCounts.find(v => v._id === "retired")?.count || 0;

    const totalDrivers = driverCounts.reduce((sum, d) => sum + d.count, 0);
    const onDutyDrivers = driverCounts.find(d => d._id === "on_duty")?.count || 0;
    const onTripDrivers = driverCounts.find(d => d._id === "on_trip")?.count || 0;
    const suspendedDrivers = driverCounts.find(d => d._id === "suspended")?.count || 0;

    const totalTrips = tripCounts.reduce((sum, t) => sum + t.count, 0);
    const completedTrips = tripCounts.find(t => t._id === "completed")?.count || 0;
    const activeTrips = tripCounts.find(t => t._id === "dispatched")?.count || 0;
    const draftTrips = tripCounts.find(t => t._id === "draft")?.count || 0;

    const fleetUtilization = totalVehicles > 0 ? Math.round((onTripVehicles / totalVehicles) * 100) : 0;

    // Average fuel cost per km
    const avgFuelCostPerKm = avgFuelCostData.length > 0 && avgFuelCostData[0].totalDistance > 0
        ? (avgFuelCostData[0].totalFuelCost / avgFuelCostData[0].totalDistance).toFixed(2)
        : 0;

    res.status(200).json(new ApiResponse(200, {
        fleet: {
            total: totalVehicles,
            available: availableVehicles,
            onTrip: onTripVehicles,
            inShop: inShopVehicles,
            retired: retiredVehicles,
            utilization: fleetUtilization,
        },
        drivers: {
            total: totalDrivers,
            onDuty: onDutyDrivers,
            onTrip: onTripDrivers,
            suspended: suspendedDrivers,
        },
        trips: {
            total: totalTrips,
            completed: completedTrips,
            active: activeTrips,
            pendingCargo: draftTrips,
        },
        maintenanceAlerts: {
            vehiclesInShop: inShopVehicles,
            activeMaintenanceLogs: maintenanceAlerts,
        },
        avgFuelCostPerKm: Number(avgFuelCostPerKm),
        recentTrips,
    }, "Dashboard KPIs fetched."));
});

// GET /api/v1/analytics/cost-breakdown
export const getCostBreakdown = asyncHandler(async (req, res) => {
    const breakdown = await Expense.aggregate([
        { $group: { _id: "$type", totalCost: { $sum: "$cost" }, count: { $sum: 1 } } },
        { $sort: { totalCost: -1 } },
    ]);

    const totalCost = breakdown.reduce((sum, item) => sum + item.totalCost, 0);

    res.status(200).json(new ApiResponse(200, {
        breakdown: breakdown.map(item => ({
            type: item._id,
            totalCost: item.totalCost,
            count: item.count,
            percentage: totalCost > 0 ? ((item.totalCost / totalCost) * 100).toFixed(1) : 0,
        })),
        totalCost,
    }, "Cost breakdown fetched."));
});

// GET /api/v1/analytics/trips-per-vehicle
export const getTripsPerVehicle = asyncHandler(async (req, res) => {
    const tripsPerVehicle = await Trip.aggregate([
        { $match: { status: { $in: ["dispatched", "completed"] } } },
        { $group: { _id: "$vehicle", totalTrips: { $sum: 1 }, completedTrips: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
        { $lookup: { from: "vehicles", localField: "_id", foreignField: "_id", as: "vehicleInfo" } },
        { $unwind: "$vehicleInfo" },
        { $project: { vehicleId: "$_id", name: "$vehicleInfo.name", licensePlate: "$vehicleInfo.licensePlate", type: "$vehicleInfo.type", totalTrips: 1, completedTrips: 1 } },
        { $sort: { totalTrips: -1 } },
    ]);

    res.status(200).json(new ApiResponse(200, { tripsPerVehicle }, "Trips per vehicle fetched."));
});

// GET /api/v1/analytics/monthly-expenses
export const getMonthlyExpenses = asyncHandler(async (req, res) => {
    const { year } = req.query;
    const matchStage = {};

    if (year) {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${parseInt(year) + 1}-01-01`);
        matchStage.date = { $gte: startDate, $lt: endDate };
    }

    const monthlyData = await Expense.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: { year: { $year: "$date" }, month: { $month: "$date" } },
                totalCost: { $sum: "$cost" },
                count: { $sum: 1 },
                fuelCost: { $sum: { $cond: [{ $eq: ["$type", "fuel"] }, "$cost", 0] } },
                maintenanceCost: { $sum: { $cond: [{ $eq: ["$type", "maintenance"] }, "$cost", 0] } },
                tollCost: { $sum: { $cond: [{ $eq: ["$type", "toll"] }, "$cost", 0] } },
                insuranceCost: { $sum: { $cond: [{ $eq: ["$type", "insurance"] }, "$cost", 0] } },
                otherCost: { $sum: { $cond: [{ $eq: ["$type", "other"] }, "$cost", 0] } },
            },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formatted = monthlyData.map(item => ({
        year: item._id.year,
        month: item._id.month,
        totalCost: item.totalCost,
        count: item.count,
        breakdown: {
            fuel: item.fuelCost,
            maintenance: item.maintenanceCost,
            toll: item.tollCost,
            insurance: item.insuranceCost,
            other: item.otherCost,
        },
    }));

    res.status(200).json(new ApiResponse(200, { monthlyExpenses: formatted }, "Monthly expenses fetched."));
});

// GET /api/v1/analytics/fuel-efficiency
export const getFuelEfficiency = asyncHandler(async (req, res) => {
    const vehicles = await Vehicle.find({ totalDistanceKm: { $gt: 0 }, totalFuelCost: { $gt: 0 } });

    const fuelData = await Promise.all(vehicles.map(async (v) => {
        const fuelExpenses = await Expense.aggregate([
            { $match: { vehicle: v._id, type: "fuel" } },
            { $group: { _id: null, totalLiters: { $sum: { $ifNull: ["$fuelLiters", 0] } }, totalCost: { $sum: "$cost" } } },
        ]);
        const totalLiters = fuelExpenses[0]?.totalLiters || 0;
        const kmPerLiter = totalLiters > 0 ? (v.totalDistanceKm / totalLiters).toFixed(2) : "N/A";
        return { vehicleId: v._id, name: v.name, licensePlate: v.licensePlate, type: v.type, totalDistanceKm: v.totalDistanceKm, totalFuelLiters: totalLiters, totalFuelCost: fuelExpenses[0]?.totalCost || 0, kmPerLiter };
    }));

    res.status(200).json(new ApiResponse(200, { fuelEfficiency: fuelData }, "Fuel efficiency data fetched."));
});

// GET /api/v1/analytics/vehicle-roi
export const getVehicleROI = asyncHandler(async (req, res) => {
    const vehicles = await Vehicle.find();

    const roiData = await Promise.all(vehicles.map(async (v) => {
        const tripRevenue = await Trip.aggregate([
            { $match: { vehicle: v._id, status: "completed" } },
            { $group: { _id: null, totalRevenue: { $sum: "$revenue" }, totalCost: { $sum: "$actualCost" } } },
        ]);
        const revenue = tripRevenue[0]?.totalRevenue || 0;
        const tripCost = tripRevenue[0]?.totalCost || 0;
        const totalExpenses = v.totalFuelCost + v.totalMaintenanceCost + tripCost;
        const netProfit = revenue - totalExpenses;
        const roi = v.acquisitionCost > 0 ? ((netProfit / v.acquisitionCost) * 100).toFixed(2) : "N/A";
        return { vehicleId: v._id, name: v.name, licensePlate: v.licensePlate, acquisitionCost: v.acquisitionCost, totalRevenue: revenue, totalExpenses, netProfit, roi: roi === "N/A" ? roi : `${roi}%`, totalTrips: v.totalTrips };
    }));

    res.status(200).json(new ApiResponse(200, { vehicleROI: roiData }, "Vehicle ROI data fetched."));
});

// GET /api/v1/analytics/export
export const exportReport = asyncHandler(async (req, res) => {
    const { type = "trips", format = "csv" } = req.query;
    let data, fields;

    if (type === "trips") {
        const trips = await Trip.find().populate("vehicle", "name licensePlate").populate("driver", "name").lean();
        data = trips.map(t => ({ origin: t.origin, destination: t.destination, vehicle: t.vehicle?.name || "", driver: t.driver?.name || "", status: t.status, cargoWeight: t.cargoWeight, revenue: t.revenue, actualCost: t.actualCost, createdAt: t.createdAt }));
        fields = ["origin", "destination", "vehicle", "driver", "status", "cargoWeight", "revenue", "actualCost", "createdAt"];
    } else if (type === "expenses") {
        const expenses = await Expense.find().populate("vehicle", "name licensePlate").lean();
        data = expenses.map(e => ({ vehicle: e.vehicle?.name || "", type: e.type, cost: e.cost, date: e.date, description: e.description, fuelLiters: e.fuelLiters || "" }));
        fields = ["vehicle", "type", "cost", "date", "description", "fuelLiters"];
    } else if (type === "vehicles") {
        const vehicles = await Vehicle.find().lean();
        data = vehicles.map(v => ({ name: v.name, licensePlate: v.licensePlate, type: v.type, status: v.status, totalTrips: v.totalTrips, totalDistanceKm: v.totalDistanceKm, totalFuelCost: v.totalFuelCost, totalMaintenanceCost: v.totalMaintenanceCost }));
        fields = ["name", "licensePlate", "type", "status", "totalTrips", "totalDistanceKm", "totalFuelCost", "totalMaintenanceCost"];
    } else {
        return res.status(400).json(new ApiResponse(400, null, "Invalid report type."));
    }

    if (format === "csv") {
        const parser = new Parser({ fields });
        const csv = parser.parse(data);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=fleetflow-${type}-report.csv`);
        return res.send(csv);
    } else if (format === "pdf") {
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=fleetflow-${type}-report.pdf`);
        doc.pipe(res);
        doc.fontSize(20).text(`FleetFlow ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: "center" });
        doc.moveDown(2);
        data.forEach((item, i) => {
            doc.fontSize(11).text(`#${i + 1}`, { underline: true });
            Object.entries(item).forEach(([key, value]) => { doc.fontSize(9).text(`  ${key}: ${value}`); });
            doc.moveDown();
            if (doc.y > 700) doc.addPage();
        });
        doc.end();
    } else {
        res.status(400).json(new ApiResponse(400, null, "Invalid format. Use csv or pdf."));
    }
});
