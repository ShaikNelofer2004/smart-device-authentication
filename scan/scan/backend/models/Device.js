const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Location tracking fields
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    locationName: {
      type: String,
      default: null
    },
    locationType: {
      type: String,
      enum: ['manual', 'gps'],
      default: 'gps'
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isTracking: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  locationHistory: [
    {
      latitude: Number,
      longitude: Number,
      locationName: String,
      locationType: String,
      lastUpdated: Date,
      accuracy: Number,
      speed: Number,
      heading: Number,
      timestamp: Date
    }
  ]
});

module.exports = mongoose.model('Device', DeviceSchema); 