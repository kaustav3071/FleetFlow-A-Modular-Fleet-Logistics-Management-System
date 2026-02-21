import Joi from "joi";

export const createDriverSchema = Joi.object({
    name: Joi.string().required().messages({
        "any.required": "Driver name is required",
    }),
    email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email",
        "any.required": "Email is required (used as driver login credential)",
    }),
    password: Joi.string().min(6).max(128).optional().messages({
        "string.min": "Password must be at least 6 characters",
    }),
    phone: Joi.string().allow(""),
    licenseNumber: Joi.string().required().messages({
        "any.required": "License number is required",
    }),
    licenseCategory: Joi.array()
        .items(Joi.string().valid("truck", "van", "bike"))
        .min(1)
        .required()
        .messages({
            "array.min": "At least one license category is required",
            "any.required": "License category is required",
        }),
    licenseExpiry: Joi.date().required().messages({
        "any.required": "License expiry date is required",
    }),
    status: Joi.string().valid("on_duty", "off_duty", "on_trip", "suspended").default("on_duty"),
    safetyScore: Joi.number().min(0).max(100).default(100),
    notes: Joi.string().allow(""),
});

export const updateDriverSchema = Joi.object({
    name: Joi.string(),
    email: Joi.string().email().allow(""),
    phone: Joi.string().allow(""),
    licenseCategory: Joi.array()
        .items(Joi.string().valid("truck", "van", "bike"))
        .min(1),
    licenseExpiry: Joi.date(),
    status: Joi.string().valid("on_duty", "off_duty", "on_trip", "suspended"),
    safetyScore: Joi.number().min(0).max(100),
    notes: Joi.string().allow(""),
}).min(1);
