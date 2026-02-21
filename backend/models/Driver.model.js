import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
    {
        // ─── Linked User Account ─────────────────────────────
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            sparse: true, // allows null for legacy drivers
        },

        name: {
            type: String,
            required: [true, "Driver name is required"],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        avatar: {
            type: String,
            default: "",
        },

        // ─── License Info ────────────────────────────────────
        licenseNumber: {
            type: String,
            required: [true, "License number is required"],
            unique: true,
            trim: true,
        },
        licenseCategory: {
            type: [String],
            enum: {
                values: ["truck", "van", "bike"],
                message: "License category must be truck, van, or bike",
            },
            required: [true, "At least one license category is required"],
        },
        licenseExpiry: {
            type: Date,
            required: [true, "License expiry date is required"],
        },

        // ─── Status ──────────────────────────────────────────
        status: {
            type: String,
            enum: {
                values: ["on_duty", "off_duty", "on_trip", "suspended"],
                message: "Status must be on_duty, off_duty, on_trip, or suspended",
            },
            default: "on_duty",
        },

        // ─── Safety & Performance ────────────────────────────
        safetyScore: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
        totalTripsCompleted: {
            type: Number,
            default: 0,
        },
        totalTripsAssigned: {
            type: Number,
            default: 0,
        },

        // ─── Notes ───────────────────────────────────────────
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ─────────────────────────────────────────────
driverSchema.index({ status: 1 });
driverSchema.index({ licenseExpiry: 1 });

// ─── Virtual: Is License Valid ───────────────────────────
driverSchema.virtual("isLicenseValid").get(function () {
    return new Date() < this.licenseExpiry;
});

// ─── Virtual: Is Available for dispatch ──────────────────
driverSchema.virtual("isAvailable").get(function () {
    return (
        this.status === "on_duty" &&
        new Date() < this.licenseExpiry
    );
});

// ─── Virtual: Trip Completion Rate ───────────────────────
driverSchema.virtual("completionRate").get(function () {
    if (this.totalTripsAssigned === 0) return 0;
    return Math.round(
        (this.totalTripsCompleted / this.totalTripsAssigned) * 100
    );
});

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;
