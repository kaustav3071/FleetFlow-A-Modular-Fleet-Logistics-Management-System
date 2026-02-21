import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { createMaintenanceSchema, updateMaintenanceSchema } from "../validators/maintenance.validator.js";
import { createMaintenanceLog, getMaintenanceLogs, getMaintenanceById, updateMaintenanceLog, completeMaintenanceLog, deleteMaintenanceLog } from "../controllers/maintenance.controller.js";

const router = Router();

router.use(protect);

router.route("/")
    .get(getMaintenanceLogs)
    .post(authorize("manager", "dispatcher"), validate(createMaintenanceSchema), createMaintenanceLog);

router.route("/:id")
    .get(getMaintenanceById)
    .put(authorize("manager", "dispatcher"), validate(updateMaintenanceSchema), updateMaintenanceLog)
    .delete(authorize("manager"), deleteMaintenanceLog);

router.patch("/:id/complete", authorize("manager", "dispatcher"), completeMaintenanceLog);

export default router;
