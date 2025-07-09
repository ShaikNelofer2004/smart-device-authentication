const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ msg: 'Access denied: Admin privileges required' });
    }
  });
};

// Middleware to check if user is superadmin
const superadminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ msg: 'Access denied: Superadmin privileges required' });
    }
  });
};

module.exports = { auth, adminAuth, superadminAuth };