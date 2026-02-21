import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { createTripSchema, completeTripSchema, updateTripSchema } from "../validators/trip.validator.js";
import { createTrip, getTrips, getTripById, updateTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip, getMyTrips } from "../controllers/trip.controller.js";

const router = Router();

router.use(protect);

// Driver-specific route — must be before /:id to avoid conflict
router.get("/my-trips", authorize("driver"), getMyTrips);

router.route("/")
    .get(getTrips)
    .post(authorize("manager", "dispatcher"), validate(createTripSchema), createTrip);

router.route("/:id")
    .get(getTripById)
    .put(authorize("manager", "dispatcher"), validate(updateTripSchema), updateTrip)
    .delete(authorize("manager"), deleteTrip);

router.patch("/:id/dispatch", authorize("manager", "dispatcher"), dispatchTrip);
router.patch("/:id/complete", authorize("manager", "dispatcher", "driver"), validate(completeTripSchema), completeTrip);
router.patch("/:id/cancel", authorize("manager", "dispatcher"), cancelTrip);

export default router;
