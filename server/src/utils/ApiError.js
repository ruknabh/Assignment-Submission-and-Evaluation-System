// Custom error class that carries an HTTP status code
// Instead of generic Error, we throw ApiError with a status
// Example: throw new ApiError(404, 'User not found')


class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export default ApiError;