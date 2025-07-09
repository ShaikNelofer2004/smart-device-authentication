# Location Tracking Feature Setup Guide

This guide explains how to set up and use the location tracking feature in the QR code scanning application.

## Features Implemented

1. **Real-time Location Tracking**: Users can share their live location with admins
2. **Distance Calculation**: Automatic calculation of distance traveled by users
3. **Admin Dashboard Map**: Admins can view all user locations on a map
4. **Live Updates**: Location data updates every 5 seconds
5. **Location History**: Track location history for each user

## Backend Changes

### New Models Added

1. **Location Model** (`backend/models/Location.js`)
   - Stores location history for each user
   - Includes latitude, longitude, timestamp, accuracy, speed, and heading

2. **Updated User Model** (`backend/models/User.js`)
   - Added `currentLocation` field (latitude, longitude, lastUpdated)
   - Added `totalDistance` field to track cumulative distance
   - Added `isOnline` field to track user status

### New API Endpoints

1. **PUT /api/locations/:userId** - Update user location
2. **GET /api/locations/users** - Get all users with their current locations
3. **GET /api/locations/history/:userId** - Get location history for a specific user
4. **PUT /api/locations/:userId/offline** - Mark user as offline

## Frontend Changes

### New Components

1. **LocationMap** (`frontend/frontend/src/components/LocationMap.js`)
   - Displays user locations on a map (requires Leaflet.js)
   - Shows statistics cards with user count, online users, total distance
   - Updates every 5 seconds automatically

2. **LocationTracker** (`frontend/frontend/src/components/LocationTracker.js`)
   - Allows users to start/stop location tracking
   - Shows current location details
   - Provides manual location update option

3. **LocationService** (`frontend/frontend/src/services/locationService.js`)
   - Handles all location-related API calls
   - Provides browser geolocation utilities
   - Includes distance calculation functions

### Updated Pages

1. **AdminDashboard** - Added tabbed interface with location tracking tab
2. **UserDashboard** - Added location tracking section for users

## Installation Instructions

### 1. Install Leaflet.js Dependencies

Navigate to the frontend directory and install the required packages:

```bash
cd frontend/frontend
npm install leaflet react-leaflet
```

### 2. Add Leaflet CSS

Add the Leaflet CSS to your `public/index.html` file:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

### 3. Update LocationMap Component

After installing the dependencies, update the `LocationMap.js` component to include the actual map implementation:

```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Replace the placeholder map container with:
<MapContainer 
  center={[0, 0]} 
  zoom={2} 
  style={{ height: '500px', width: '100%' }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  />
  {users.map((user) => (
    user.currentLocation && (
      <Marker
        key={user._id}
        position={[user.currentLocation.latitude, user.currentLocation.longitude]}
      >
        <Popup>
          <div>
            <h3>{user.name}</h3>
            <p>Email: {user.email}</p>
            <p>Distance: {(user.totalDistance || 0).toFixed(2)} km</p>
            <p>Status: {user.isOnline ? 'Online' : 'Offline'}</p>
          </div>
        </Popup>
      </Marker>
    )
  ))}
</MapContainer>
```

## Usage Instructions

### For Users

1. **Start Location Tracking**:
   - Go to your dashboard
   - Find the "Location Tracking" section
   - Click "Start Tracking" to begin sharing your location
   - Allow location access when prompted by your browser

2. **Stop Location Tracking**:
   - Click "Stop Tracking" to stop sharing your location
   - Your status will be marked as offline

3. **Manual Location Update**:
   - Click "Update Location Once" to share your current location without continuous tracking

### For Admins

1. **View User Locations**:
   - Go to the Admin Dashboard
   - Click on the "Location Tracking" tab
   - View the map showing all user locations
   - See statistics including total users, online users, and total distance

2. **Monitor Live Updates**:
   - The map and user list update automatically every 5 seconds
   - Green indicators show online users
   - Distance traveled is calculated and displayed for each user

## Security Considerations

1. **Authentication Required**: All location endpoints require valid authentication tokens
2. **User Privacy**: Users must explicitly start location tracking
3. **Data Retention**: Location history is stored but can be limited by implementing cleanup policies
4. **HTTPS Required**: Location sharing requires HTTPS in production

## Browser Compatibility

The location tracking feature uses the HTML5 Geolocation API, which is supported by:
- Chrome 5+
- Firefox 3.5+
- Safari 5+
- Edge 12+
- Mobile browsers (iOS Safari, Android Chrome)

## Troubleshooting

### Common Issues

1. **"Geolocation is not supported"**
   - Ensure you're using a modern browser
   - Check if HTTPS is enabled (required for geolocation)

2. **"Permission denied"**
   - Allow location access when prompted by the browser
   - Check browser settings for location permissions

3. **Map not loading**
   - Ensure Leaflet.js dependencies are installed
   - Check if the CSS is properly loaded
   - Verify internet connection for map tiles

4. **Location not updating**
   - Check if the user has started location tracking
   - Verify network connectivity
   - Check browser console for errors

### Performance Optimization

1. **Limit Location History**: Implement cleanup policies to remove old location data
2. **Optimize Updates**: Consider increasing update intervals for better performance
3. **Caching**: Implement client-side caching for frequently accessed data

## API Documentation

### Update Location
```http
PUT /api/locations/:userId
Content-Type: application/json
Authorization: Bearer <token>

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "speed": 5.5,
  "heading": 90
}
```

### Get All User Locations
```http
GET /api/locations/users
Authorization: Bearer <token>
```

### Get User Location History
```http
GET /api/locations/history/:userId?limit=100
Authorization: Bearer <token>
```

### Mark User Offline
```http
PUT /api/locations/:userId/offline
Authorization: Bearer <token>
```

## Future Enhancements

1. **Geofencing**: Set up virtual boundaries and alerts
2. **Route Tracking**: Track and display user movement paths
3. **Real-time Notifications**: Push notifications for location events
4. **Analytics Dashboard**: Detailed location analytics and reports
5. **Mobile App**: Native mobile application for better location accuracy 