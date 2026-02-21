/**
 * Wraps an async express route handler to automatically
 * catch errors and forward them to the global error handler.
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
