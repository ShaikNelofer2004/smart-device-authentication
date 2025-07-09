const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   POST api/auth/forgot-password
// @desc    Request password reset (send OTP)
// @access  Public
router.post('/forgot-password', authController.requestPasswordReset);

// @route   POST api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', authController.resetPassword);

// @route   PUT api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', auth, authController.updateProfile);

// @route   POST api/auth/change-password
// @desc    Change current user password
// @access  Private
router.post('/change-password', auth, authController.changePassword);

// @route   POST api/auth/request-otp
// @desc    Request OTP for phone login (admin/superadmin)
// @access  Public
router.post('/request-otp', authController.requestOTPByPhone);

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and login via phone (admin/superadmin)
// @access  Public
router.post('/verify-otp', authController.verifyOTPByPhone);

module.exports = router;