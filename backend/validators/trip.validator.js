import Joi from "joi";

export const createTripSchema = Joi.object({
    vehicle: Joi.string().required().messages({
        "any.required": "Vehicle ID is required",
    }),
    driver: Joi.string().allow("", null).optional(),
    origin: Joi.string().required().messages({
        "any.required": "Origin is required",
    }),
    destination: Joi.string().required().messages({
        "any.required": "Destination is required",
    }),
    cargoDescription: Joi.string().allow(""),
    cargoWeight: Joi.number().positive().required().messages({
        "number.positive": "Cargo weight must be positive",
        "any.required": "Cargo weight is required",
    }),
    cargoUnit: Joi.string().valid("kg", "tons").default("kg"),
    startOdometer: Joi.number().min(0),
    estimatedCost: Joi.number().min(0),
    revenue: Joi.number().min(0),
    notes: Joi.string().allow(""),
});

export const completeTripSchema = Joi.object({
    endOdometer: Joi.number().positive().required().messages({
        "number.positive": "End odometer must be positive",
        "any.required": "End odometer reading is required",
    }),
    actualCost: Joi.number().min(0),
    notes: Joi.string().allow(""),
});

export const updateTripSchema = Joi.object({
    origin: Joi.string(),
    destination: Joi.string(),
    cargoDescription: Joi.string().allow(""),
    cargoWeight: Joi.number().positive(),
    cargoUnit: Joi.string().valid("kg", "tons"),
    estimatedCost: Joi.number().min(0),
    revenue: Joi.number().min(0),
    notes: Joi.string().allow(""),
}).min(1);
