const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');
const { adminAuth } = require('../middleware/auth');
const Device = require('../models/Device');
const User = require('../models/User');
const axios = require('axios');

// @route   POST api/qrcodes/generate
// @desc    Generate and store new QR codes
// @access  Admin/Superadmin
router.post('/generate', adminAuth, qrCodeController.generateCodes);

// @route   POST /api/qr/:qrCode
// @desc    Get QR code details from real data
// @access  Public
router.post('/:qrCode', async (req, res) => {
  const { qrCode } = req.params;
  // Try Device first
  let device = await Device.findOne({ qrCode }).populate('userId', 'name email');
  if (device) {
    return res.json({
      qrNumber: device.qrCode,
      scannedBy: device.userId ? device.userId.name : 'Unknown',
      location: device.currentLocation && device.currentLocation.latitude != null && device.currentLocation.longitude != null
        ? {
            latitude: device.currentLocation.latitude,
            longitude: device.currentLocation.longitude,
            locationName: device.currentLocation.locationName || null
          }
        : null,
      timestamp: device.currentLocation && device.currentLocation.lastUpdated ? device.currentLocation.lastUpdated : device.createdAt,
      status: device.isOnline ? 'active' : 'inactive'
    });
  }
  // Try User (main QR, allow qrCode or uniqueCode)
  let user = await User.findOne({ $or: [{ qrCode }, { uniqueCode: qrCode }] });
  if (user) {
    return res.json({
      qrNumber: user.qrCode,
      scannedBy: user.name,
      location: user.currentLocation && user.currentLocation.latitude != null && user.currentLocation.longitude != null
        ? {
            latitude: user.currentLocation.latitude,
            longitude: user.currentLocation.longitude,
            locationName: user.currentLocation.locationName || null
          }
        : null,
      timestamp: user.currentLocation && user.currentLocation.lastUpdated ? user.currentLocation.lastUpdated : user.createdAt,
      status: user.isOnline ? 'active' : 'inactive'
    });
  }
  return res.status(404).json({ error: 'QR code not found' });
});

// @route   POST /api/qrcodes/:qrCode/location
// @desc    Update QR code location (device or user)
// @access  Admin/Superadmin
router.post('/:qrCode/location', adminAuth, async (req, res) => {
  const { qrCode } = req.params;
  let { latitude, longitude, locationName } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Latitude and longitude must be numbers.' });
  }

  // If locationName is not provided, use reverse geocoding
  if (!locationName) {
    try {
      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      locationName = geoRes.data.address.city || geoRes.data.address.town || geoRes.data.address.village || geoRes.data.address.state || geoRes.data.display_name || null;
    } catch (err) {
      locationName = null; // fallback if geocoding fails
    }
  }

  // Try Device first
  let device = await Device.findOne({ qrCode });
  if (device) {
    // Before pushing to locationHistory
    const last = device.locationHistory[device.locationHistory.length - 1];
    if (!last || last.latitude !== latitude || last.longitude !== longitude) {
      device.locationHistory.push({
        latitude,
        longitude,
        locationName: locationName || null,
        lastUpdated: new Date(),
      });
      device.currentLocation = {
        latitude,
        longitude,
        locationName: locationName || null,
        lastUpdated: new Date(),
      };
      await device.save();
    }
    const sortedHistory = device.locationHistory.slice().sort(
      (a, b) => new Date(a.timestamp || a.lastUpdated) - new Date(b.timestamp || b.lastUpdated)
    ).map(loc => ({
      ...loc,
      locationName: loc.locationName || 'Future'
    }));
    return res.json({
      message: 'Device location updated',
      qrCode: device.qrCode,
      latitude: device.currentLocation.latitude,
      longitude: device.currentLocation.longitude,
      locationName: device.currentLocation.locationName,
      lastUpdated: device.currentLocation.lastUpdated,
      locationHistory: (device.locationHistory || []).map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: loc.locationName,
        lastUpdated: loc.lastUpdated,
        _id: loc._id
      }))
    });
  }
  // Try User (main QR, allow qrCode or uniqueCode)
  let user = await User.findOne({ $or: [{ qrCode }, { uniqueCode: qrCode }] });
  if (user) {
    // Append to locationHistory (create if not exists)
    if (!user.locationHistory) user.locationHistory = [];
    const last = user.locationHistory[user.locationHistory.length - 1];
    if (!last || last.latitude !== latitude || last.longitude !== longitude) {
      user.locationHistory.push({
        latitude,
        longitude,
        locationName: locationName || null,
        lastUpdated: new Date(),
      });
      // Update currentLocation
      user.currentLocation = {
        latitude,
        longitude,
        locationName: locationName || null,
        lastUpdated: new Date(),
      };
      await user.save();
    }
    const sortedHistory = user.locationHistory.slice().sort(
      (a, b) => new Date(a.timestamp || a.lastUpdated) - new Date(b.timestamp || b.lastUpdated)
    ).map(loc => ({
      ...loc,
      locationName: loc.locationName || 'Future'
    }));
    return res.json({
      message: 'User location updated',
      qrCode: user.qrCode,
      latitude: user.currentLocation.latitude,
      longitude: user.currentLocation.longitude,
      locationName: user.currentLocation.locationName,
      lastUpdated: user.currentLocation.lastUpdated,
      locationHistory: (user.locationHistory || []).map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: loc.locationName,
        lastUpdated: loc.lastUpdated,
        _id: loc._id
      }))
    });
  }
  return res.status(404).json({ error: 'QR code not found' });
});

// @route   GET /api/qrcodes/:qrCode/history
// @desc    Get full location history for a QR code (device or user)
// @access  Admin/Superadmin
router.get('/:qrCode/history', adminAuth, async (req, res) => {
  const { qrCode } = req.params;
  // Try Device first
  let device = await Device.findOne({ qrCode });
  if (device) {
    return res.json({
      qrCode: device.qrCode,
      locationHistory: (device.locationHistory || []).map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: loc.locationName,
        lastUpdated: loc.lastUpdated,
        _id: loc._id
      }))
    });
  }
  // Try User (main QR, allow qrCode or uniqueCode)
  let user = await User.findOne({ $or: [{ qrCode }, { uniqueCode: qrCode }] });
  if (user) {
    return res.json({
      qrCode: user.qrCode,
      locationHistory: (user.locationHistory || []).map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: loc.locationName,
        lastUpdated: loc.lastUpdated,
        _id: loc._id
      }))
    });
  }
  return res.status(404).json({ error: 'QR code not found' });
});

// @route   PUT /api/qrcodes/:qrCode/fix-location-names
// @desc    Fill in missing locationName for all points in locationHistory
// @access  Admin/Superadmin
router.put('/:qrCode/fix-location-names', adminAuth, async (req, res) => {
  const { qrCode } = req.params;
  const axios = require('axios');

  // Try Device first
  let device = await Device.findOne({ qrCode });
  let updated = false;
  if (device && device.locationHistory) {
    for (let loc of device.locationHistory) {
      if (!loc.locationName && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        try {
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}`
          );
          loc.locationName = geoRes.data.address.city || geoRes.data.address.town || geoRes.data.address.village || geoRes.data.address.state || geoRes.data.display_name || 'Unknown';
          updated = true;
        } catch (err) {
          loc.locationName = 'Unknown';
        }
      }
    }
    if (updated) await device.save();
    const sortedFixedHistory = device.locationHistory.slice().sort(
      (a, b) => new Date(a.timestamp || a.lastUpdated) - new Date(b.timestamp || b.lastUpdated)
    ).map(loc => ({
      ...loc,
      locationName: loc.locationName || 'Future'
    }));
    return res.json({ message: 'Device location names fixed', locationHistory: (device.locationHistory || []).map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationName: loc.locationName,
      lastUpdated: loc.lastUpdated,
      _id: loc._id
    })) });
  }

  // Try User (main QR, allow qrCode or uniqueCode)
  let user = await User.findOne({ $or: [{ qrCode }, { uniqueCode: qrCode }] });
  if (user && user.locationHistory) {
    for (let loc of user.locationHistory) {
      if (!loc.locationName && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        try {
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}`
          );
          loc.locationName = geoRes.data.address.city || geoRes.data.address.town || geoRes.data.address.village || geoRes.data.address.state || geoRes.data.display_name || 'Unknown';
          updated = true;
        } catch (err) {
          loc.locationName = 'Unknown';
        }
      }
    }
    if (updated) await user.save();
    const sortedFixedHistory = user.locationHistory.slice().sort(
      (a, b) => new Date(a.timestamp || a.lastUpdated) - new Date(b.timestamp || b.lastUpdated)
    ).map(loc => ({
      ...loc,
      locationName: loc.locationName || 'Future'
    }));
    return res.json({ message: 'User location names fixed', locationHistory: (user.locationHistory || []).map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationName: loc.locationName,
      lastUpdated: loc.lastUpdated,
      _id: loc._id
    })) });
  }

  return res.status(404).json({ error: 'QR code not found' });
});

module.exports = router; 