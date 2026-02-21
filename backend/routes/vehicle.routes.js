import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadVehicleImage } from "../middlewares/upload.middleware.js";
import { createVehicleSchema, updateVehicleSchema } from "../validators/vehicle.validator.js";
import { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle, updateVehicleStatus, getAvailableVehicles } from "../controllers/vehicle.controller.js";

const router = Router();

// All vehicle routes require authentication
router.use(protect);

router.get("/available", getAvailableVehicles);

router.route("/")
    .get(getVehicles)
    .post(authorize("manager", "dispatcher"), uploadVehicleImage, validate(createVehicleSchema), createVehicle);

router.route("/:id")
    .get(getVehicleById)
    .put(authorize("manager", "dispatcher"), uploadVehicleImage, validate(updateVehicleSchema), updateVehicle)
    .delete(authorize("manager"), deleteVehicle);

router.patch("/:id/status", authorize("manager", "dispatcher"), updateVehicleStatus);

export default router;
