import { Router } from "express";
import authRoutes from "./auth.routes.js";
import vehicleRoutes from "./vehicle.routes.js";
import driverRoutes from "./driver.routes.js";
import tripRoutes from "./trip.routes.js";
import maintenanceRoutes from "./maintenance.routes.js";
import expenseRoutes from "./expense.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/trips", tripRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/expenses", expenseRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
