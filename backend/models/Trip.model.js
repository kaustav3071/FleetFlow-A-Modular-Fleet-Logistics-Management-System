import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: [true, "Vehicle is required"],
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: [true, "Driver is required"],
        },

        // ─── Route Info ──────────────────────────────────────
        origin: {
            type: String,
            required: [true, "Origin is required"],
            trim: true,
        },
        destination: {
            type: String,
            required: [true, "Destination is required"],
            trim: true,
        },

        // ─── Cargo Info ──────────────────────────────────────
        cargoDescription: {
            type: String,
            trim: true,
            default: "",
        },
        cargoWeight: {
            type: Number,
            required: [true, "Cargo weight is required"],
            min: [0, "Cargo weight cannot be negative"],
        },
        cargoUnit: {
            type: String,
            enum: ["kg", "tons"],
            default: "kg",
        },

        // ─── Trip Lifecycle ──────────────────────────────────
        status: {
            type: String,
            enum: {
                values: ["draft", "dispatched", "completed", "cancelled"],
                message: "Status must be draft, dispatched, completed, or cancelled",
            },
            default: "draft",
        },

        // ─── Odometer Readings ───────────────────────────────
        startOdometer: {
            type: Number,
            default: 0,
        },
        endOdometer: {
            type: Number,
            default: 0,
        },

        // ─── Timestamps ──────────────────────────────────────
        dispatchedAt: Date,
        completedAt: Date,
        cancelledAt: Date,

        // ─── Financial ───────────────────────────────────────
        estimatedCost: {
            type: Number,
            default: 0,
        },
        actualCost: {
            type: Number,
            default: 0,
        },
        revenue: {
            type: Number,
            default: 0,
        },

        // ─── Notes ───────────────────────────────────────────
        notes: {
            type: String,
            default: "",
        },

        // ─── Created By ──────────────────────────────────────
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ─────────────────────────────────────────────
tripSchema.index({ status: 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });
tripSchema.index({ createdAt: -1 });

// ─── Virtual: Distance Covered ───────────────────────────
tripSchema.virtual("distanceKm").get(function () {
    if (this.endOdometer && this.startOdometer) {
        return this.endOdometer - this.startOdometer;
    }
    return 0;
});

const Trip = mongoose.model("Trip", tripSchema);
export default Trip;
