const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');
const { ensureGuest } = require('../middleware/auth');

// Render Login Page
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login - ClubSphere ',
    currentPage: 'login'
  });
});

// Process Login
router.post('/login', ensureGuest, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error_msg', 'Please provide both email and password.');
      return res.redirect('/auth/login');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('club');
    if (!user) {
      req.flash('error_msg', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    // Set session data
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
      department: user.department,
      year: user.year,
      club: user.club ? { _id: user.club._id, name: user.club.name, code: user.club.code } : null
    };

    req.flash('success_msg', `Welcome back, ${user.name}!`);

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'secretary':
        return res.redirect('/secretary/dashboard');
      case 'core':
        return res.redirect('/core/dashboard');
      case 'faculty':
        return res.redirect('/faculty/dashboard');
      default:
        return res.redirect('/student/dashboard');
    }
  } catch (error) {
    console.error('Login Error:', error);
    req.flash('error_msg', 'An unexpected error occurred during login.');
    res.redirect('/auth/login');
  }
});

// Render Register Page (for Students)
router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', {
    title: 'Student Registration - ClubSphere ',
    currentPage: 'register'
  });
});

// Process Student Registration
router.post('/register', ensureGuest, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, rollNo, department, year, phone } = req.body;

    if (!name || !email || !password || !rollNo) {
      req.flash('error_msg', 'Please fill in all required fields.');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error_msg', 'Password must be at least 6 characters long.');
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match.');
      return res.redirect('/auth/register');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'An account with this email already exists.');
      return res.redirect('/auth/register');
    }

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student',
      rollNo: rollNo.toUpperCase().trim(),
      department: department || 'Computer Applications',
      year: parseInt(year, 10) || 1,
      phone: phone || ''
    });

    await newUser.save();

    // Auto-login registered student
    req.session.user = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      rollNo: newUser.rollNo,
      department: newUser.department,
      year: newUser.year,
      club: null
    };

    req.flash('success_msg', 'Registration successful! Welcome to College ClubSphere.');
    res.redirect('/student/dashboard');
  } catch (error) {
    console.error('Registration Error:', error);
    req.flash('error_msg', 'Error registering user: ' + error.message);
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destruction error:', err);
    res.redirect('/auth/login');
  });
});

module.exports = router;
