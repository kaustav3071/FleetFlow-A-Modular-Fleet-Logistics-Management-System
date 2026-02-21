import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Vehicle name is required"],
            trim: true,
        },
        model: {
            type: String,
            trim: true,
            default: "",
        },
        licensePlate: {
            type: String,
            required: [true, "License plate is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        type: {
            type: String,
            required: [true, "Vehicle type is required"],
            enum: {
                values: ["truck", "van", "bike"],
                message: "Vehicle type must be truck, van, or bike",
            },
        },
        maxLoadCapacity: {
            type: Number,
            required: [true, "Max load capacity is required"],
            min: [0, "Capacity cannot be negative"],
        },
        capacityUnit: {
            type: String,
            enum: ["kg", "tons"],
            default: "kg",
        },
        currentOdometer: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: {
                values: ["available", "on_trip", "in_shop", "retired"],
                message: "Status must be available, on_trip, in_shop, or retired",
            },
            default: "available",
        },
        image: {
            type: String,
            default: "",
        },
        region: {
            type: String,
            trim: true,
            default: "",
        },
        acquisitionCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        acquisitionDate: {
            type: Date,
        },
        // ─── Fuel Tracking ───────────────────────────────────
        fuelType: {
            type: String,
            enum: ["petrol", "diesel", "electric", "cng", "hybrid"],
            default: "diesel",
        },
        fuelCostPerKm: {
            type: Number,
            default: 10,
            min: 0,
        },
        // ─── Computed Fields (cached for performance) ────────
        totalTrips: {
            type: Number,
            default: 0,
        },
        totalDistanceKm: {
            type: Number,
            default: 0,
        },
        totalFuelCost: {
            type: Number,
            default: 0,
        },
        totalMaintenanceCost: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ─────────────────────────────────────────────
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ region: 1 });

// ─── Virtual: Is Available for dispatch ──────────────────
vehicleSchema.virtual("isAvailable").get(function () {
    return this.status === "available";
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
