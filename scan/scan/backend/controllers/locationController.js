const User = require('../models/User');
const Location = require('../models/Location');

// Update user location
const updateLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { latitude, longitude, accuracy, speed, heading, locationName, isTracking, locationType } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ msg: 'Latitude and longitude are required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Calculate distance if previous location exists
    let distanceIncrement = 0;
    if (user.currentLocation.latitude && user.currentLocation.longitude) {
      distanceIncrement = calculateDistance(
        user.currentLocation.latitude,
        user.currentLocation.longitude,
        latitude,
        longitude
      );
    }

    // Determine locationType
    let newLocationType = locationType;
    if (!newLocationType) {
      newLocationType = locationName ? 'manual' : 'gps';
    }

    // Update user's current location
    user.currentLocation = {
      latitude,
      longitude,
      locationName: locationName || null,
      locationType: newLocationType,
      lastUpdated: new Date()
    };
    user.totalDistance += distanceIncrement;
    user.isOnline = true;
    if (typeof isTracking === 'boolean') user.isTracking = isTracking;
    await user.save();

    // Save location history
    const locationEntry = new Location({
      userId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading
    });
    await locationEntry.save();

    res.json({
      msg: 'Location updated successfully',
      currentLocation: user.currentLocation,
      totalDistance: user.totalDistance,
      isTracking: user.isTracking
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all users with their current locations
const getAllUserLocations = async (req, res) => {
  try {
    const users = await User.find({
      'currentLocation.latitude': { $ne: null },
      'currentLocation.longitude': { $ne: null }
    }).select('name email uniqueCode currentLocation totalDistance isOnline lastLogin isTracking');

    res.json(users);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get location history for a specific user
const getUserLocationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const locations = await Location.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(locations);
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Mark user as offline and stop tracking
const markUserOffline = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isOnline = false;
    user.isTracking = false;
    await user.save();

    res.json({ msg: 'User marked as offline' });
  } catch (error) {
    console.error('Error marking user offline:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

module.exports = {
  updateLocation,
  getAllUserLocations,
  getUserLocationHistory,
  markUserOffline
}; 