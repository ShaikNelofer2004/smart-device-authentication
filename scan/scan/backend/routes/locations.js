const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  updateLocation,
  getAllUserLocations,
  getUserLocationHistory,
  markUserOffline
} = require('../controllers/locationController');

// Update user location (requires authentication)
router.put('/:userId', auth, updateLocation);

// Get all users with their current locations (admin only)
router.get('/users', auth, getAllUserLocations);

// Get location history for a specific user (admin only)
router.get('/history/:userId', auth, getUserLocationHistory);

// Mark user as offline (requires authentication)
router.put('/:userId/offline', auth, markUserOffline);

module.exports = router; 