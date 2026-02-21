import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: [true, "Vehicle is required"],
        },
        trip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trip",
        },
        type: {
            type: String,
            required: [true, "Expense type is required"],
            enum: {
                values: ["fuel", "maintenance", "toll", "insurance", "other"],
                message: "Expense type must be fuel, maintenance, toll, insurance, or other",
            },
        },

        // ─── Fuel-specific Fields ────────────────────────────
        fuelLiters: {
            type: Number,
            min: [0, "Fuel liters cannot be negative"],
        },
        pricePerLiter: {
            type: Number,
            min: [0, "Price per liter cannot be negative"],
        },

        // ─── General Fields ──────────────────────────────────
        cost: {
            type: Number,
            required: [true, "Cost is required"],
            min: [0, "Cost cannot be negative"],
        },
        date: {
            type: Date,
            required: [true, "Date is required"],
            default: Date.now,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        receipt: {
            type: String, // Cloudinary URL
            default: "",
        },
        loggedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ─────────────────────────────────────────────
expenseSchema.index({ vehicle: 1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ trip: 1 });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
