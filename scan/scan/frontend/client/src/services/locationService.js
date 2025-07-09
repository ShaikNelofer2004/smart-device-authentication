import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('token');

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export const locationService = {
  // Get all users with their current locations
  getAllUserLocations: async () => {
    try {
      const response = await api.get('/locations/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user location
  updateLocation: async (userId, locationData) => {
    try {
      const response = await api.put(`/locations/${userId}`, locationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get location history for a specific user
  getUserLocationHistory: async (userId, limit = 100) => {
    try {
      const response = await api.get(`/locations/history/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark user as offline
  markUserOffline: async (userId) => {
    try {
      const response = await api.put(`/locations/${userId}/offline`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search for locations by name using OpenStreetMap Nominatim API
  searchLocation: async (query) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 10,
          addressdetails: 1
        },
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to search location. Please try again.');
    }
  },

  // Get current user's location from browser
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  },

  // Watch user's location (for continuous tracking)
  watchLocation: (onSuccess, onError) => {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported by this browser.'));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        });
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  },

  // Calculate distance between two points
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  },
};

export default locationService; 