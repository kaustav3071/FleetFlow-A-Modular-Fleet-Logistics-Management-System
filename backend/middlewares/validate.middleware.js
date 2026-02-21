import ApiError from "../utils/ApiError.js";

/**
 * Joi validation middleware factory
 * Usage: validate(schema) where schema is a Joi schema object
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message).join(". ");
            throw new ApiError(400, messages);
        }

        next();
    };
};

export default validate;
