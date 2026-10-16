const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'salary_enroll_enterprise_jwt_secret_key_2026_xyz';
const IS_DEMO_MODE = process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';

/**
 * Authentication middleware.
 * Verifies Bearer JWT token against MongoDB user accounts.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Fetch user from MongoDB to ensure user is active and exists
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.active) {
        req.user = user;
        return next();
      } else if (user && !user.active) {
        return res.status(403).json({ success: false, error: 'User account has been deactivated.' });
      }
    } catch (err) {
      if (!IS_DEMO_MODE) {
        return res.status(401).json({ success: false, error: 'Invalid or expired authentication token. Please log in again.' });
      }
    }
  }

  // Development Fallback if enabled
  if (IS_DEMO_MODE) {
    const demoRole = req.headers['x-demo-role'] || 'admin';
    req.user = {
      id: '000000000000000000000001',
      name: 'Development Administrator',
      email: 'admin@apexind.com',
      role: demoRole,
      department: 'Administration'
    };
    res.setHeader('x-auth-mode', 'development-demo');
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Authentication required. Please log in to access this resource.'
  });
}

/**
 * Role-based authorization middleware.
 */
function requireRole(allowedRoles = ['admin']) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthenticated user.' });
    }

    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
    });
  };
}

/**
 * Privacy & Log Sanitizer
 */
function sanitizeForLogging(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  const sensitiveFields = [
    'uan', 'bank_account', 'bankAccount', 'ifsc', 'pan', 'aadhaar',
    'buffer', 'data', 'content', 'password', 'token', 'authorization'
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  return sanitized;
}

module.exports = {
  authenticateToken,
  requireRole,
  sanitizeForLogging,
  JWT_SECRET
};
