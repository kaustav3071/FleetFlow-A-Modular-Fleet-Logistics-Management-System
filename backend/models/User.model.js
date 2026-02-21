import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                "Please provide a valid email",
            ],
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: {
                values: ["manager", "dispatcher", "safety_officer", "analyst", "driver"],
                message: "Role must be manager, dispatcher, safety_officer, analyst, or driver",
            },
            default: "dispatcher",
        },
        avatar: {
            type: String,
            default: "",
        },

        // ─── Email Verification ──────────────────────────────
        // NOTE: Defaulting to true to skip email verification for development
        isVerified: {
            type: Boolean,
            default: true,
        },
        verificationToken: String,
        verificationTokenExpiry: Date,

        // ─── Password Reset ──────────────────────────────────
        resetPasswordToken: String,
        resetPasswordExpiry: Date,

        // ─── Google OAuth ────────────────────────────────────
        googleId: {
            type: String,
            sparse: true,
        },

        // ─── Refresh Token ───────────────────────────────────
        refreshToken: {
            type: String,
            select: false,
        },

        // ─── Account Status ──────────────────────────────────
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: Date,
    },
    {
        timestamps: true,
    }
);

// ─── Pre-save: Hash Password ─────────────────────────────
userSchema.pre("save", async function () {
    // Only hash if the password field is modified
    if (!this.isModified("password")) return;

    // Skip if no password (Google OAuth users)
    if (!this.password) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Method: Compare Password ───────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Sanitize for Response ──────────────
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.verificationToken;
    delete user.verificationTokenExpiry;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpiry;
    delete user.__v;
    return user;
};

const User = mongoose.model("User", userSchema);
export default User;
