import Joi from "joi";

export const createVehicleSchema = Joi.object({
    name: Joi.string().required().messages({
        "any.required": "Vehicle name is required",
    }),
    model: Joi.string().allow(""),
    licensePlate: Joi.string().required().messages({
        "any.required": "License plate is required",
    }),
    type: Joi.string().valid("truck", "van", "bike").required().messages({
        "any.only": "Vehicle type must be truck, van, or bike",
        "any.required": "Vehicle type is required",
    }),
    maxLoadCapacity: Joi.number().positive().required().messages({
        "number.positive": "Capacity must be positive",
        "any.required": "Max load capacity is required",
    }),
    capacityUnit: Joi.string().valid("kg", "tons").default("kg"),
    currentOdometer: Joi.number().min(0).default(0),
    region: Joi.string().allow(""),
    acquisitionCost: Joi.number().min(0).default(0),
    acquisitionDate: Joi.date(),
    fuelType: Joi.string().valid("petrol", "diesel", "electric", "cng", "hybrid").default("diesel"),
});

export const updateVehicleSchema = Joi.object({
    name: Joi.string(),
    model: Joi.string().allow(""),
    type: Joi.string().valid("truck", "van", "bike"),
    maxLoadCapacity: Joi.number().positive(),
    capacityUnit: Joi.string().valid("kg", "tons"),
    currentOdometer: Joi.number().min(0),
    status: Joi.string().valid("available", "on_trip", "in_shop", "retired"),
    region: Joi.string().allow(""),
    acquisitionCost: Joi.number().min(0),
    acquisitionDate: Joi.date(),
    fuelType: Joi.string().valid("petrol", "diesel", "electric", "cng", "hybrid"),
}).min(1);
