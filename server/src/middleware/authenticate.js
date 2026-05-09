import jwt from 'jsonwebtoken';

// Verifies the JWT token from the Authorization header
// Attaches decoded user info to req.user for use in controllers
// Usage: router.get('/protected', authenticate, asyncHandler(...))

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role } available in all protected routes
    next();
  } catch (err) {
    next(err); // JsonWebTokenError or TokenExpiredError → goes to errorHandler
  }
};

export default authenticate;