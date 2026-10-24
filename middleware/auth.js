const Notification = require('../models/Notification');

// Middleware to ensure user is logged in
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page.');
  res.redirect('/auth/login');
};

// Middleware to prevent logged-in users from visiting login/register
const ensureGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'secretary') return res.redirect('/secretary/dashboard');
    if (role === 'core') return res.redirect('/core/dashboard');
    if (role === 'faculty') return res.redirect('/faculty/dashboard');
    return res.redirect('/student/dashboard');
  }
  next();
};

// Middleware for Role-Based Access Control (RBAC)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error_msg', 'Please log in first.');
      return res.redirect('/auth/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      req.flash('error_msg', `Access denied: Requires ${allowedRoles.join(' or ')} privileges.`);
      return res.redirect('/');
    }

    next();
  };
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  authorizeRoles
};
