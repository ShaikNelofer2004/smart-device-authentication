const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { auth, adminAuth, superadminAuth } = require('../middleware/auth');

// @route   POST api/devices/add
// @desc    Add a new device
// @access  Private
router.post('/add', auth, deviceController.addDevice);

// @route   GET api/devices
// @desc    Get all devices for a user
// @access  Private
router.get('/', auth, deviceController.getUserDevices);

// @route   PUT api/devices/:deviceId/location
// @desc    Update a device's location
// @access  Private
router.put('/:deviceId/location', auth, deviceController.updateDeviceLocation);

// @route   GET api/devices/all-locations
// @desc    Get all devices with locations (admin/superadmin)
// @access  Admin/Superadmin
router.get('/all-locations', adminAuth, deviceController.getAllDevicesWithLocations);

// Mark a device as offline
router.put('/:deviceId/offline', auth, deviceController.markDeviceOffline);

// @route   GET api/devices/:deviceId/history
// @desc    Get location history for a device
// @access  Private
router.get('/:deviceId/history', auth, deviceController.getDeviceLocationHistory);

// @route   DELETE api/devices/:deviceId
// @desc    Delete a device by ID
// @access  Superadmin
router.delete('/:deviceId', superadminAuth, deviceController.deleteDevice);

// @route   DELETE api/devices/qr/:qrCode
// @desc    Delete a device by QR code
// @access  Superadmin
router.delete('/qr/:qrCode', superadminAuth, deviceController.deleteDeviceByQrCode);

module.exports = router; 