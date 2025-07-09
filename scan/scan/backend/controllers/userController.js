const User = require('../models/User');
const Device = require('../models/Device');

// Get all users (for admin/superadmin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete user (for superadmin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent deleting superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ msg: 'Cannot delete superadmin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update user role (for superadmin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent changing superadmin role
    if (user.role === 'superadmin') {
      return res.status(403).json({ msg: 'Cannot change superadmin role' });
    }

    user.role = role;
    await user.save();

    res.json({ msg: 'User role updated successfully', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all users with their main QR code and all their device QR codes (for admin/superadmin)
exports.getAllUsersWithDevices = async (req, res) => {
  try {
    // Get all users (excluding password)
    const users = await User.find().select('-password');
    // Get all devices with full details
    const devices = await Device.find();
    // Debug: log all devices
    console.log('All devices:', devices);
    // Map userId to devices (ensure string comparison)
    const devicesByUser = devices.reduce((acc, device) => {
      const userId = device.userId.toString();
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push({
        _id: device._id,
        qrCode: device.qrCode,
        totalDistance: device.totalDistance || 0,
        currentLocation: device.currentLocation,
        isOnline: device.isOnline,
        isTracking: device.isTracking,
        createdAt: device.createdAt
      });
      return acc;
    }, {});
    // Debug: log devicesByUser mapping
    console.log('devicesByUser:', devicesByUser);
    // Build response
    const result = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      uniqueCode: user.uniqueCode,
      qrCode: user.qrCode,
      devices: devicesByUser[user._id.toString()] || []
    }));
    // Debug: log final result
    console.log('Final user-device mapping:', result);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};