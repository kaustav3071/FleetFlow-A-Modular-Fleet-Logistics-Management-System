import Joi from "joi";

export const createMaintenanceSchema = Joi.object({
    vehicle: Joi.string().required().messages({
        "any.required": "Vehicle ID is required",
    }),
    serviceType: Joi.string()
        .valid(
            "oil_change",
            "tire_replacement",
            "brake_service",
            "engine_repair",
            "transmission",
            "battery",
            "inspection",
            "body_repair",
            "electrical",
            "other"
        )
        .required()
        .messages({
            "any.required": "Service type is required",
        }),
    description: Joi.string().allow(""),
    cost: Joi.number().min(0).required().messages({
        "any.required": "Cost is required",
    }),
    serviceDate: Joi.date().default(Date.now),
    odometerAtService: Joi.number().min(0),
    vendor: Joi.string().allow(""),
    notes: Joi.string().allow(""),
});

export const updateMaintenanceSchema = Joi.object({
    serviceType: Joi.string().valid(
        "oil_change",
        "tire_replacement",
        "brake_service",
        "engine_repair",
        "transmission",
        "battery",
        "inspection",
        "body_repair",
        "electrical",
        "other"
    ),
    description: Joi.string().allow(""),
    cost: Joi.number().min(0),
    vendor: Joi.string().allow(""),
    notes: Joi.string().allow(""),
}).min(1);
