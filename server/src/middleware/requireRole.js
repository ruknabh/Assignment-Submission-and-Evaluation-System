// Role-based access control (RBAC) — use after authenticate middleware
// Pass one or more allowed roles as arguments
// Usage: router.post('/courses', authenticate, requireRole('teacher', 'admin'), ...)

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  }

  next();
};

export default requireRole;