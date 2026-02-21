import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: [true, "Vehicle is required"],
        },
        serviceType: {
            type: String,
            required: [true, "Service type is required"],
            enum: {
                values: [
                    "oil_change",
                    "tire_replacement",
                    "brake_service",
                    "engine_repair",
                    "transmission",
                    "battery",
                    "inspection",
                    "body_repair",
                    "electrical",
                    "other",
                ],
                message: "Invalid service type",
            },
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        cost: {
            type: Number,
            required: [true, "Cost is required"],
            min: [0, "Cost cannot be negative"],
        },
        serviceDate: {
            type: Date,
            required: [true, "Service date is required"],
            default: Date.now,
        },
        completedDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: {
                values: ["in_progress", "completed"],
                message: "Status must be in_progress or completed",
            },
            default: "in_progress",
        },
        odometerAtService: {
            type: Number,
            default: 0,
        },
        vendor: {
            type: String,
            trim: true,
            default: "",
        },
        notes: {
            type: String,
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
maintenanceSchema.index({ vehicle: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ serviceDate: -1 });

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);
export default Maintenance;
