import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import {
    getDashboardKPIs,
    getFuelEfficiency,
    getVehicleROI,
    getCostBreakdown,
    getTripsPerVehicle,
    getMonthlyExpenses,
    exportReport,
} from "../controllers/analytics.controller.js";

const router = Router();

router.use(protect);

router.get("/dashboard", getDashboardKPIs);
router.get("/cost-breakdown", getCostBreakdown);
router.get("/trips-per-vehicle", getTripsPerVehicle);
router.get("/monthly-expenses", getMonthlyExpenses);
router.get("/fuel-efficiency", authorize("manager", "analyst", "safety_officer"), getFuelEfficiency);
router.get("/vehicle-roi", authorize("manager", "analyst", "safety_officer"), getVehicleROI);
router.get("/export", authorize("manager", "analyst"), exportReport);

export default router;
