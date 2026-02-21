import ApiError from "../utils/ApiError.js";

/**
 * Pre-process request body to handle array fields sent via FormData
 * FormData sends arrays as comma-separated strings, so we need to parse them
 */
const preprocessBody = (body, arrayFields = []) => {
    const processed = { ...body };
    arrayFields.forEach((field) => {
        if (processed[field] && typeof processed[field] === "string") {
            processed[field] = processed[field].split(",").filter(Boolean);
        }
    });
    return processed;
};

/**
 * Joi validation middleware factory
 * Usage: validate(schema, { arrayFields: ['field1', 'field2'] })
 * arrayFields: Fields that should be treated as arrays when received as comma-separated strings
 */
const validate = (schema, options = {}) => {
    return (req, res, next) => {
        const { arrayFields = [] } = options;
        
        // Pre-process body to handle array fields from FormData
        if (arrayFields.length > 0) {
            req.body = preprocessBody(req.body, arrayFields);
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message).join(". ");
            throw new ApiError(400, messages);
        }

        // Replace body with validated and transformed value
        req.body = value;
        next();
    };
};

export default validate;
