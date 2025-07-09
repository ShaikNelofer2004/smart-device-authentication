# Device Distance Tracking with Polylines

This document describes the enhanced device location tracking features that have been added to the admin dashboard, including distance calculation and polyline visualization.

## Features Added

### 1. Distance Calculation
- **Backend**: Added Haversine formula calculation in `deviceController.js`
- **Real-time**: Distance is calculated and updated whenever a device location changes
- **Accumulative**: Total distance is stored in the device model and updated incrementally

### 2. Polyline Visualization
- **Device Map**: Shows travel paths with colored polylines for each device
- **Distance Markers**: Displays total distance traveled on the map
- **Toggle Control**: "Show All Paths" button to display/hide all device paths
- **Individual Focus**: Click on a device to focus on its specific path

### 3. Enhanced Admin Dashboard
- **Distance Statistics**: Overview cards showing total distances for users and devices
- **History Tab**: Enhanced with distance calculation and polyline display
- **Device Cards**: Show both stored and calculated distances
- **QR Code Display**: Device QR codes now show distance information

## Technical Implementation

### Backend Changes

#### Device Controller (`deviceController.js`)
```javascript
// Added distance calculation function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Enhanced location update with distance tracking
exports.updateDeviceLocation = async (req, res) => {
  // ... existing code ...
  
  // Calculate distance if previous location exists
  let distanceIncrement = 0;
  if (device.currentLocation && device.currentLocation.latitude != null) {
    distanceIncrement = calculateDistance(
      device.currentLocation.latitude,
      device.currentLocation.longitude,
      latitude,
      longitude
    );
  }
  
  // Update total distance
  device.totalDistance += distanceIncrement;
  
  // ... rest of the function ...
};
```

#### User Controller (`userController.js`)
- Enhanced `getAllUsersWithDevices` to include device distance information
- Now returns full device objects instead of just QR codes

### Frontend Changes

#### DeviceLocationMap Component
- Added distance calculation functions
- Enhanced polyline display with distance markers
- Added "Show All Paths" toggle
- Improved popup information with distance data

#### AdminDashboard Component
- Added distance statistics cards
- Enhanced history tab with distance calculation
- Updated QR code display to show device distances
- Improved user detail drawer with device distance info

## Usage

### For Admins

1. **View Distance Statistics**
   - Go to "Location Tracking" tab
   - View overview cards showing total distances

2. **View Device Paths**
   - Click "Show All Paths" to display all device travel routes
   - Click on individual devices to focus on their specific path
   - Distance markers show total distance traveled

3. **View History**
   - Go to "History" tab
   - Select a user to view their location history
   - Polyline shows the complete travel path with distance

### For Developers

#### Testing Distance Tracking
```bash
# Run the device distance test
cd scan/backend
node test-device-distance.js
```

This test will:
- Create a test user and device
- Update device location through multiple points in New York City
- Verify distance calculations
- Test the complete API flow

#### API Endpoints

**Update Device Location**
```
PUT /api/devices/:deviceId/location
Headers: x-auth-token
Body: {
  latitude: number,
  longitude: number,
  locationName?: string,
  locationType?: string,
  accuracy?: number,
  speed?: number,
  heading?: number
}
Response: {
  msg: string,
  device: {
    ...deviceData,
    distanceIncrement: string,
    totalDistance: number
  }
}
```

**Get Device History**
```
GET /api/devices/:deviceId/history
Headers: x-auth-token
Response: Array of location objects with timestamps
```

## Distance Calculation

The system uses the Haversine formula to calculate distances between GPS coordinates:

```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

## Visual Features

### Polyline Colors
- Each device gets a unique color from a predefined palette
- Colors are consistent across map views and device cards
- Selected devices show brighter, thicker polylines

### Distance Markers
- Black background with white text
- Positioned at the midpoint of each path
- Show total distance in kilometers
- Different sizes for individual vs. all paths view

### Interactive Elements
- Click devices to focus on their path
- Hover over polylines to see device information
- Toggle between showing all paths or individual focus

## Database Schema

### Device Model
```javascript
{
  // ... existing fields ...
  totalDistance: {
    type: Number,
    default: 0
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
}
```

## Performance Considerations

- Distance calculations are performed server-side for accuracy
- Location history is stored efficiently with timestamps
- Polyline rendering is optimized for smooth map interactions
- Distance markers are positioned to avoid overlapping

## Future Enhancements

1. **Speed Analysis**: Calculate average speed between points
2. **Route Optimization**: Suggest optimal routes
3. **Geofencing**: Alert when devices enter/exit specific areas
4. **Export Features**: Export travel data to CSV/PDF
5. **Real-time Updates**: WebSocket integration for live tracking 