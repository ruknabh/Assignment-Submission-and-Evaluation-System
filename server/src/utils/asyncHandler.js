// Wraps async route functions so we don't need try/catch in every controller
// Any error thrown inside gets forwarded to the global errorHandler automatically
// Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))



const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;