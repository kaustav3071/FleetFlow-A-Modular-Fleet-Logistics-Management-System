import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";
import { createDriverSchema, updateDriverSchema } from "../validators/driver.validator.js";
import { createDriver, getDrivers, getDriverById, updateDriver, deleteDriver, updateDriverStatus, getAvailableDrivers } from "../controllers/driver.controller.js";

const router = Router();

router.use(protect);

router.get("/available", getAvailableDrivers);

router.route("/")
    .get(getDrivers)
    .post(authorize("manager", "dispatcher"), uploadAvatar, validate(createDriverSchema, { arrayFields: ["licenseCategory"] }), createDriver);

router.route("/:id")
    .get(getDriverById)
    .put(authorize("manager", "dispatcher", "safety_officer"), uploadAvatar, validate(updateDriverSchema, { arrayFields: ["licenseCategory"] }), updateDriver)
    .delete(authorize("manager"), deleteDriver);

router.patch("/:id/status", authorize("manager", "dispatcher", "safety_officer"), updateDriverStatus);

export default router;
