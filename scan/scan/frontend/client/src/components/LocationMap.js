import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton
} from '@mui/material';
import { Person, LocationOn, DirectionsWalk, ArrowBack, MyLocation, OpenInNew } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import Tooltip from '@mui/material/Tooltip';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Haversine formula to calculate distance between two lat/lon points in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate total distance from location history
function calculateTotalDistance(history) {
  let total = 0;
  for (let i = 1; i < history.length; i++) {
    total += haversineDistance(
      history[i - 1].latitude,
      history[i - 1].longitude,
      history[i].latitude,
      history[i].longitude
    );
  }
  return total;
}

const LocationMap = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLocationHistory, setUserLocationHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [deviceError, setDeviceError] = useState(null);
  const mapRef = useRef(null);

  const fetchUserLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/locations/users', {
        headers: { 'x-auth-token': token }
      });
      setUsers(res.data);
      setLoading(false);
      
      // Set map center based on user locations
      if (res.data.length > 0) {
        const usersWithLocation = res.data.filter(user => user.currentLocation);
        if (usersWithLocation.length > 0) {
          const avgLat = usersWithLocation.reduce((sum, user) => sum + user.currentLocation.latitude, 0) / usersWithLocation.length;
          const avgLng = usersWithLocation.reduce((sum, user) => sum + user.currentLocation.longitude, 0) / usersWithLocation.length;
          setMapCenter([avgLat, avgLng]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch user locations');
      setLoading(false);
    }
  };

  const fetchUserLocationHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      // Remove limit or set a high limit to get full history
      const res = await axios.get(`http://localhost:5000/api/locations/history/${userId}`,
        { headers: { 'x-auth-token': token } });
      setUserLocationHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch user location history:', err);
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    await fetchUserLocationHistory(user._id);
  };

  const handleBackToAllUsers = () => {
    setSelectedUser(null);
    setUserLocationHistory([]);
  };

  const centerOnUser = (user) => {
    if (mapRef.current && user.currentLocation) {
      mapRef.current.setView([user.currentLocation.latitude, user.currentLocation.longitude], 15);
    }
  };

  const fetchDeviceLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/devices/all-locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data);
      setDeviceLoading(false);
    } catch (err) {
      setDeviceError(err.response?.data?.msg || 'Failed to fetch device locations');
      setDeviceLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLocations();
    fetchDeviceLocations();
    // Set up interval to refresh data every 5 seconds
    const interval = setInterval(() => {
      fetchUserLocations();
      fetchDeviceLocations();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate total distance for all users
  const totalDistance = users.reduce((sum, user) => sum + (user.totalDistance || 0), 0);
  const onlineUsers = users.filter(user => user.isOnline).length;

  // Device stats
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(device => device.isOnline).length;

  // Debug: Log all devices received from backend
  console.log('Devices from backend:', devices);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (deviceLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (deviceError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>{deviceError}</Alert>
    );
  }

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">{users.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6">{onlineUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsWalk sx={{ mr: 1, color: 'info.main' }} />
                <Box>
                  <Typography variant="h6">{totalDistance.toFixed(2)} km</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Distance
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip icon={<LocationOn />} label="Devices" color="secondary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{totalDevices}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online: {onlineDevices}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Map Container */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {selectedUser ? `${selectedUser.name}'s Location Map` : 'User Locations Map'}
          </Typography>
          {selectedUser && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MyLocation />}
                onClick={() => centerOnUser(selectedUser)}
              >
                Center on User
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBack />}
                onClick={handleBackToAllUsers}
              >
                Back to All Users
              </Button>
            </Box>
          )}
        </Box>
        <Box 
          sx={{ 
            height: '500px', 
            width: '100%', 
            border: '1px solid #ddd',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <MapContainer 
            center={selectedUser && selectedUser.currentLocation 
              ? [selectedUser.currentLocation.latitude, selectedUser.currentLocation.longitude]
              : mapCenter
            } 
            zoom={selectedUser ? 15 : (users.length > 0 ? 10 : 2)} 
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Default">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Dark">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
              </LayersControl.BaseLayer>
            </LayersControl>
            
            {/* Show all users if no specific user selected */}
            {!selectedUser && users.map((user) => (
              user.currentLocation &&
              user.currentLocation.latitude != null &&
              user.currentLocation.longitude != null && (
                <Marker
                  key={user._id}
                  position={[user.currentLocation.latitude, user.currentLocation.longitude]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                      background-color: ${user.isOnline ? '#4caf50' : '#9e9e9e'};
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      border: 3px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 12px;
                      cursor: pointer;
                    ">${user.name.charAt(0).toUpperCase()}</div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })}
                  eventHandlers={{
                    click: () => handleUserClick(user)
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{user.name}</h3>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Email:</strong> {user.email}</p>
                      {user.currentLocation.locationName && (
                        <p style={{ margin: '4px 0', fontSize: '14px', color: '#1976d2', fontWeight: 'bold' }}>
                          📍 {user.currentLocation.locationName}
                        </p>
                      )}
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Distance:</strong> {(user.totalDistance || 0).toFixed(2)} km</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Status:</strong> 
                        <span style={{ 
                          color: user.isOnline ? '#4caf50' : '#9e9e9e',
                          fontWeight: 'bold'
                        }}>
                          {user.isOnline ? ' Online' : ' Offline'}
                        </span>
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                        <strong>Last Updated:</strong> {user.currentLocation.lastUpdated ? new Date(user.currentLocation.lastUpdated).toLocaleString() : 'Never'}
                      </p>
                      {/* Device/QR Code Info */}
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#333' }}>
                        <strong>Device:</strong> {user.device ? user.device.name : 'N/A'}<br/>
                        <strong>QR Code:</strong> {user.qrCode ? user.qrCode.code : 'N/A'}
                      </p>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleUserClick(user)}
                        sx={{ mt: 1 }}
                      >
                        View User Map
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Show selected user with location history */}
            {selectedUser && selectedUser.currentLocation && (
              <>
                {/* Current location marker */}
                <Marker
                  key={`current-${selectedUser._id}`}
                  position={[selectedUser.currentLocation.latitude, selectedUser.currentLocation.longitude]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                      background-color: #2196f3;
                      width: 25px;
                      height: 25px;
                      border-radius: 50%;
                      border: 3px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 14px;
                    ">${selectedUser.name.charAt(0).toUpperCase()}</div>`,
                    iconSize: [25, 25],
                    iconAnchor: [12.5, 12.5]
                  })}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{selectedUser.name} (Current)</h3>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Email:</strong> {selectedUser.email}</p>
                      {selectedUser.currentLocation.locationName && (
                        <p style={{ margin: '4px 0', fontSize: '14px', color: '#1976d2', fontWeight: 'bold' }}>
                          📍 {selectedUser.currentLocation.locationName}
                        </p>
                      )}
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Distance:</strong> {userLocationHistory.length > 1 ? calculateTotalDistance(userLocationHistory).toFixed(2) : '0.00'} km</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Status:</strong> 
                        <span style={{ 
                          color: selectedUser.isOnline ? '#4caf50' : '#9e9e9e',
                          fontWeight: 'bold'
                        }}>
                          {selectedUser.isOnline ? ' Online' : ' Offline'}
                        </span>
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                        <strong>Last Updated:</strong> {selectedUser.currentLocation.lastUpdated ? new Date(selectedUser.currentLocation.lastUpdated).toLocaleString() : 'Never'}
                      </p>
                      {/* Device/QR Code Info */}
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#333' }}>
                        <strong>Device:</strong> {selectedUser.device ? selectedUser.device.name : 'N/A'}<br/>
                        <strong>QR Code:</strong> {selectedUser.qrCode ? selectedUser.qrCode.code : 'N/A'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
                {/* Polyline for user movement */}
                {userLocationHistory.length > 1 && (
                  <Polyline
                    positions={userLocationHistory.map(loc => [loc.latitude, loc.longitude])}
                    color="#2196f3"
                    weight={4}
                    opacity={0.7}
                  />
                )}
                {/* Location history markers */}
                {userLocationHistory.slice(0, 10).map((location, index) => (
                  <Marker
                    key={`history-${selectedUser._id}-${index}`}
                    position={[location.latitude, location.longitude]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        background-color: #ff9800;
                        width: 15px;
                        height: 15px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                        opacity: ${0.3 + (index * 0.07)};
                      "></div>`,
                      iconSize: [15, 15],
                      iconAnchor: [7.5, 7.5]
                    })}
                  >
                    <Popup>
                      <div style={{ minWidth: '150px' }}>
                        <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>Location History</h4>
                        <p style={{ margin: '2px 0', fontSize: '12px' }}><strong>Time:</strong> {new Date(location.timestamp).toLocaleString()}</p>
                        {location.accuracy && (
                          <p style={{ margin: '2px 0', fontSize: '12px' }}><strong>Accuracy:</strong> ±{location.accuracy.toFixed(1)}m</p>
                        )}
                        {location.speed && (
                          <p style={{ margin: '2px 0', fontSize: '12px' }}><strong>Speed:</strong> {(location.speed * 3.6).toFixed(1)} km/h</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}

            {/* Device markers */}
            {devices
              .filter(device =>
                device.currentLocation &&
                device.currentLocation.latitude != null &&
                device.currentLocation.longitude != null &&
                device.isOnline // Only show if sharing is ON
              )
              .map(device => (
                <Marker
                  key={device._id}
                  position={[device.currentLocation.latitude, device.currentLocation.longitude]}
                >
                  <Popup>
                    <Typography variant="subtitle2">Device QR: {device.qrCode}</Typography>
                    <Typography variant="body2">User: {device.userId?.name || '-'}</Typography>
                    <Typography variant="body2">Email: {device.userId?.email || '-'}</Typography>
                    <Typography variant="body2">Role: {device.userId?.role || '-'}</Typography>
                    <Typography variant="body2">Lat: {device.currentLocation.latitude}, Lng: {device.currentLocation.longitude}</Typography>
                    <Typography variant="body2">Last Updated: {device.currentLocation.lastUpdated ? new Date(device.currentLocation.lastUpdated).toLocaleString() : '-'}</Typography>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </Box>
      </Paper>

      {/* User Locations Cards */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>User Locations</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {users.map(user => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={user._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    <Typography variant="body2" color="text.secondary">Code: {user.uniqueCode || 'N/A'}</Typography>
                  </Box>
                  <Chip label={user.isOnline ? 'Online' : 'Offline'} color={user.isOnline ? 'success' : 'default'} size="small" />
                </Box>
                <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                  {user.currentLocation && user.currentLocation.locationName ? (
                    <>
                      <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {user.currentLocation.locationName}
                    </>
                  ) : ' '}
                </Typography>
                <Typography variant="body2"><strong>Location:</strong> {user.currentLocation && user.currentLocation.latitude != null && user.currentLocation.longitude != null ? `${user.currentLocation.latitude.toFixed(5)}, ${user.currentLocation.longitude.toFixed(5)}` : 'N/A'}</Typography>
                <Typography variant="body2"><strong>Device:</strong> N/A</Typography>
                <Typography variant="body2"><strong>QR Code:</strong> N/A</Typography>
                <Typography variant="body2"><strong>Distance:</strong> {(user.totalDistance || 0).toFixed(2)} km</Typography>
                <Typography variant="body2"><strong>Last Updated:</strong> {user.currentLocation && user.currentLocation.lastUpdated ? new Date(user.currentLocation.lastUpdated).toLocaleString() : 'N/A'}</Typography>
                <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => centerOnUser(user)}>VIEW MAP</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Device Locations Cards */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Device Locations</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {devices
          .filter(device => device.isOnline)
          .map(device => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={device._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Device QR</Typography>
                      <Typography variant="body2" color="text.secondary">{device.qrCode}</Typography>
                      <Typography variant="body2" color="text.secondary">User: {device.userId?.name || 'N/A'}</Typography>
                    </Box>
                    <Chip label={device.isOnline ? 'Online' : 'Offline'} color={device.isOnline ? 'success' : 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    {device.currentLocation && device.currentLocation.locationName ? (
                      <>
                        <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        {device.currentLocation.locationName}
                      </>
                    ) : ' '}
                  </Typography>
                  <Typography variant="body2"><strong>Location:</strong> {device.currentLocation && device.currentLocation.latitude != null && device.currentLocation.longitude != null ? `${device.currentLocation.latitude.toFixed(5)}, ${device.currentLocation.longitude.toFixed(5)}` : 'No location yet'}</Typography>
                  <Typography variant="body2"><strong>Distance:</strong> {(device.totalDistance || 0).toFixed(2)} km</Typography>
                  <Typography variant="body2"><strong>Last Updated:</strong> {device.currentLocation && device.currentLocation.lastUpdated ? new Date(device.currentLocation.lastUpdated).toLocaleString() : 'N/A'}</Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => {
                    if (device.currentLocation && device.currentLocation.latitude != null && device.currentLocation.longitude != null && mapRef.current) {
                      mapRef.current.setView([device.currentLocation.latitude, device.currentLocation.longitude], 15);
                    }
                  }}>VIEW MAP</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};

export default LocationMap; 