import Joi from "joi";

export const createExpenseSchema = Joi.object({
    vehicle: Joi.string().required().messages({
        "any.required": "Vehicle ID is required",
    }),
    trip: Joi.string().allow("", null),
    type: Joi.string()
        .valid("fuel", "maintenance", "toll", "insurance", "other")
        .required()
        .messages({
            "any.required": "Expense type is required",
        }),
    fuelLiters: Joi.number().min(0).when("type", {
        is: "fuel",
        then: Joi.required().messages({
            "any.required": "Fuel liters is required for fuel expenses",
        }),
    }),
    pricePerLiter: Joi.number().min(0),
    cost: Joi.number().min(0).required().messages({
        "any.required": "Cost is required",
    }),
    date: Joi.date().default(Date.now),
    description: Joi.string().allow(""),
});

export const updateExpenseSchema = Joi.object({
    type: Joi.string().valid("fuel", "maintenance", "toll", "insurance", "other"),
    fuelLiters: Joi.number().min(0),
    pricePerLiter: Joi.number().min(0),
    cost: Joi.number().min(0),
    date: Joi.date(),
    description: Joi.string().allow(""),
}).min(1);
