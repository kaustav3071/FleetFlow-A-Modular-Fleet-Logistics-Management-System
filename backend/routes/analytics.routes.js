import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { getDashboardKPIs, getFuelEfficiency, getVehicleROI, exportReport } from "../controllers/analytics.controller.js";

const router = Router();

router.use(protect);

router.get("/dashboard", getDashboardKPIs);
router.get("/fuel-efficiency", authorize("manager", "analyst"), getFuelEfficiency);
router.get("/vehicle-roi", authorize("manager", "analyst"), getVehicleROI);
router.get("/export", authorize("manager", "analyst"), exportReport);

export default router;
