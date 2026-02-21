import { Router } from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { uploadReceipt } from "../middlewares/upload.middleware.js";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validator.js";
import { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense, getVehicleExpenseSummary } from "../controllers/expense.controller.js";

const router = Router();

router.use(protect);

router.get("/vehicle/:vehicleId/summary", getVehicleExpenseSummary);

router.route("/")
    .get(getExpenses)
    .post(authorize("manager", "dispatcher"), uploadReceipt, validate(createExpenseSchema), createExpense);

router.route("/:id")
    .get(getExpenseById)
    .put(authorize("manager", "dispatcher"), uploadReceipt, validate(updateExpenseSchema), updateExpense)
    .delete(authorize("manager"), deleteExpense);

export default router;
