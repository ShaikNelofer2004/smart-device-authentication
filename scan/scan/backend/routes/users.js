const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { adminAuth, superadminAuth } = require('../middleware/auth');

// @route   GET api/users
// @desc    Get all users
// @access  Admin/Superadmin
router.get('/', adminAuth, userController.getAllUsers);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Superadmin
router.delete('/:id', superadminAuth, userController.deleteUser);

// @route   PUT api/users/:id/role
// @desc    Update user role
// @access  Superadmin
router.put('/:id/role', superadminAuth, userController.updateUserRole);

// @route   GET api/users/with-devices
// @desc    Get all users with their main QR code and all their device QR codes
// @access  Admin/Superadmin
router.get('/with-devices', adminAuth, userController.getAllUsersWithDevices);

module.exports = router;