import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, CircularProgress, Alert, Button, Card, CardContent, Grid, Chip, Tooltip, TextField } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const COLORS = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'];

// Calculate total distance from location history
const calculateTotalDistance = (history) => {
  if (!history || history.length < 2) return 0;
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
};

// Haversine formula to calculate distance between two points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

const DeviceLocationMap = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [deviceHistories, setDeviceHistories] = useState({});
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [searchError, setSearchError] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Helper function to set today's date
  const setToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today);
    setEndDate(today);
  };

  // Helper function to set previous day's date
  const setPreviousDay = () => {
    const previousDay = new Date();
    previousDay.setDate(previousDay.getDate() - 1);
    previousDay.setHours(0, 0, 0, 0);
    setStartDate(previousDay);
    setEndDate(previousDay);
  };
  const mapRef = useRef(null);

  const fetchDeviceLocations = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const res = await axios.get('http://localhost:5000/api/devices/all-locations', {
        headers: { 'x-auth-token': token }
      });

      // Filter and process devices
      const activeDevices = res.data.filter(device => device.isActive);
      console.log('Active devices:', activeDevices);
      
      setDevices(activeDevices);
      setLoading(false);
      setUpdating(false);
      setError(null); // Clear any previous errors
      setLastUpdateTime(new Date());

      if (activeDevices.length > 0) {
        const devicesWithLocation = activeDevices.filter(device => device.currentLocation);
        if (devicesWithLocation.length > 0) {
          const avgLat = devicesWithLocation.reduce((sum, device) => sum + device.currentLocation.latitude, 0) / devicesWithLocation.length;
          const avgLng = devicesWithLocation.reduce((sum, device) => sum + device.currentLocation.longitude, 0) / devicesWithLocation.length;
          setMapCenter([avgLat, avgLng]);
        }
      }
    } catch (err) {
      console.error('Error fetching device locations:', err);
      setError(err.response?.data?.msg || 'Failed to fetch device locations. Please try again.');
      setLoading(false);
      setUpdating(false);
    }
  };

  // Fetch device location history for all devices
  const fetchDeviceHistories = async (devices) => {
    console.log('Fetching histories for devices:', devices);
    const token = localStorage.getItem('token');
    const newHistories = { ...deviceHistories };
    
    await Promise.all(devices.map(async (device) => {
      try {
        if (!device._id) {
          console.warn('Device missing _id:', device);
          return;
        }
        
        console.log('Fetching history for device:', device._id);
        const existingHistory = newHistories[device._id] || [];
        const lastUpdate = existingHistory.length > 0 ? 
          new Date(existingHistory[existingHistory.length - 1].lastUpdated).toISOString() : 
          null;
        
        const res = await axios.get(
          `http://localhost:5000/api/devices/${device._id}/history${lastUpdate ? `?since=${lastUpdate}` : ''}`,
          { headers: { 'x-auth-token': token } }
        );
        
        // Merge new history with existing history
        newHistories[device._id] = existingHistory.concat(res.data.filter(newLoc => {
          return !existingHistory.some(existingLoc => 
            existingLoc.lastUpdated === newLoc.lastUpdated
          );
        }));
        
        // Sort by timestamp
        newHistories[device._id].sort((a, b) => 
          new Date(a.lastUpdated) - new Date(b.lastUpdated)
        );
      } catch (err) {
        console.error('Error fetching history for device', device._id, err);
        if (!newHistories[device._id]) {
          newHistories[device._id] = [];
        }
      }
    }));
    
    setDeviceHistories(newHistories);
  };

  const handleViewMap = (device) => {
    setSelectedDevice(device);
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current._container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSearch = () => {
    const searchTerm = searchCode.trim();
    if (!searchTerm) {
      setSearchError('Please enter a device QR code');
      return;
    }
    const found = devices.find(d => d.qrCode === searchTerm);
    if (found) {
      setSelectedDevice(found);
      setSearchError('');
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current._container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Refresh device list before showing error
      fetchDeviceLocations().then(() => {
        setSearchError('Device not found. Please verify the QR code and ensure the device is registered.');
      });
    }
  };

  useEffect(() => {
    fetchDeviceLocations();
    // Set up polling interval to refresh device locations
    const intervalId = setInterval(fetchDeviceLocations, 5000); // Refresh every 5 seconds for more real-time updates
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (devices && devices.length > 0) {
      console.log('Devices loaded:', devices);
      devices.forEach(d => console.log('Device _id:', d._id, 'qrCode:', d.qrCode));
      fetchDeviceHistories(devices);
      
      // If a device is selected, center map on its latest location
      if (selectedDevice && mapRef.current) {
        const device = devices.find(d => d._id === selectedDevice._id);
        if (device && device.currentLocation) {
          const map = mapRef.current;
          map.setView(
            [device.currentLocation.latitude, device.currentLocation.longitude],
            map.getZoom(),
            { animate: true }
          );
        }
      }
    } else {
      console.warn('No devices loaded, not fetching histories');
    }
  }, [devices, selectedDevice]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <TextField
          label="Enter Device QR Code"
          value={searchCode}
          onChange={e => setSearchCode(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleSearch}>Search</Button>
        {searchError && <Typography color="error">{searchError}</Typography>}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600 }}>Device Locations Map</Typography>
          {updating && <CircularProgress size={20} />}
          {lastUpdateTime && (
            <Typography variant="caption" sx={{ color: '#666' }}>
              Last updated: {new Date(lastUpdateTime).toLocaleString()}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant={showAllPaths ? "contained" : "outlined"} 
            size="small"
            onClick={() => setShowAllPaths(!showAllPaths)}
            sx={{
              backgroundColor: showAllPaths ? '#2c3e50' : 'transparent',
              color: showAllPaths ? 'white' : '#2c3e50',
              borderColor: '#2c3e50',
              '&:hover': {
                backgroundColor: showAllPaths ? '#34495e' : '#f0f0f0',
              }
            }}
          >
            {showAllPaths ? "Hide All Paths" : "Show All Paths"}
          </Button>
          {devices.length > 0 && (
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 2, backgroundColor: '#2c3e50', color: 'white', borderRadius: 1 }}>
              Total Distance: {devices.reduce((sum, device) => sum + (device.totalDistance || 0), 0).toFixed(2)} km
            </Typography>
          )}
        </Box>
      </Box>
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0', width: '1400px', maxWidth: '100%', margin: '0 auto' }}>
        <Box sx={{ height: '500px', width: '100%' }}>
          <MapContainer
            center={
              selectedDevice && selectedDevice.currentLocation
                ? [selectedDevice.currentLocation.latitude, selectedDevice.currentLocation.longitude]
                : mapCenter
            }
            zoom={selectedDevice ? 15 : (devices.length > 0 ? 10 : 2)}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {selectedDevice ? (() => {
                  const history = deviceHistories[selectedDevice._id] || [];
                  const validHistory = history.filter(loc => {
                    if (!loc || !loc.lastUpdated || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return false;
                    
                    const date = new Date(loc.lastUpdated);
                    date.setHours(0,0,0,0); // Normalize to start of day for comparison
                    
                    const start = startDate ? new Date(startDate) : null;
                    const end = endDate ? new Date(endDate) : null;
                    
                    if (start) {
                      start.setHours(0,0,0,0);
                      const startTime = start.getTime();
                      if (date.getTime() < startTime) return false;
                    }
                    
                    if (end) {
                      end.setHours(0,0,0,0);
                      const endTime = end.getTime();
                      if (date.getTime() > endTime) return false;
                    }
                    
                    return true;
                  });
              const latestLoc = validHistory.length > 0
                ? validHistory[validHistory.length - 1]
                : selectedDevice.currentLocation;
                  return (
                    <>
                      {validHistory.length > 1 && (
                        <Polyline
                          positions={validHistory.map(loc => [loc.latitude, loc.longitude])}
                          color={COLORS[devices.findIndex(d => d._id === selectedDevice._id) % COLORS.length]}
                          weight={5}
                          opacity={0.8}
                        />
                      )}
                            <Marker
                    position={[latestLoc.latitude, latestLoc.longitude]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        background: ${COLORS[devices.findIndex(d => d._id === selectedDevice._id) % COLORS.length]};
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        border: 4px solid white;
                        box-shadow: 0 3px 14px rgba(0,0,0,0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        position: relative;
                        animation: pulse 2s infinite;
                      ">${selectedDevice.qrCode ? selectedDevice.qrCode.slice(-2) : ''}</div>
                      <style>
                        @keyframes pulse {
                          0% { transform: scale(1); }
                          50% { transform: scale(1.1); }
                          100% { transform: scale(1); }
                        }
                      </style>
                      <div style="
                        position: absolute;
                        top: -30px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        font-size: 12px;
                        white-space: nowrap;
                      ">
                        <strong>Current Location</strong><br/>
                        ${latestLoc.latitude.toFixed(6)}, ${latestLoc.longitude.toFixed(6)}
                      </div>`
                    })}
                  >
                    <Popup>
                      <div style={{ minWidth: '250px' }}>
                        <div style={{ 
                          borderBottom: '2px solid ' + COLORS[devices.findIndex(d => d._id === selectedDevice._id) % COLORS.length],
                          paddingBottom: '8px',
                          marginBottom: '8px',
                          fontWeight: 'bold',
                          color: COLORS[devices.findIndex(d => d._id === selectedDevice._id) % COLORS.length]
                        }}>
                          Current Location Details
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Device ID:</strong> {selectedDevice.qrCode}
                        </div>
                        {selectedDevice.deviceName && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Device Name:</strong> {selectedDevice.deviceName}
                          </div>
                        )}
                        <div style={{ 
                          marginBottom: '4px',
                          padding: '8px',
                          backgroundColor: '#f0f8ff',
                          borderRadius: '4px',
                          border: '1px solid #e1f0ff'
                        }}>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Latitude:</strong> {latestLoc.latitude.toFixed(6)}
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Longitude:</strong> {latestLoc.longitude.toFixed(6)}
                          </div>
                        </div>
                        {latestLoc.locationName && (
                          <div style={{ 
                            marginBottom: '4px',
                            padding: '8px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}>
                            <strong>Location:</strong> {latestLoc.locationName}
                          </div>
                        )}
                        <div style={{ 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          <strong>Last Updated:</strong><br/>
                          {latestLoc.lastUpdated ? new Date(latestLoc.lastUpdated).toLocaleString() : '-'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                <Button variant="contained" color="primary" size="medium" sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, fontWeight: 600 }} onClick={() => setSelectedDevice(null)}>
                  Back to All Devices
                </Button>
              </>
              );
            })() : (
              devices.map((device, deviceIdx) =>
                device.locationHistory && device.locationHistory.map((loc, idx) => (
                  <Marker
                    key={device.qrCode + '-' + idx}
                    position={[loc.latitude, loc.longitude]}
                    icon={L.divIcon({
                      className: 'custom-path-marker',
                      html: `<div style="width:32px;height:32px;background:${COLORS[deviceIdx % COLORS.length]};border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;">
                        ${device.qrCode.slice(-2)}
                      </div>`,
                      iconAnchor: [16, 32],
                      popupAnchor: [0, -32]
                    })}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -36]}
                      opacity={1}
                      permanent
                      className="latlng-tooltip"
                    >
                      <div style={{
                        background: 'rgba(255,255,255,0.95)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}>
                        <div style={{ color: COLORS[deviceIdx % COLORS.length], fontWeight: 'bold', marginBottom: '2px' }}>
                          Device: {device.qrCode}
                        </div>
                        <div style={{ color: '#666' }}>
                          Lat: {loc.latitude.toFixed(6)}<br/>
                          Lng: {loc.longitude.toFixed(6)}
                        </div>
                      </div>
                    </Tooltip>
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px' }}>
                          <strong style={{ color: COLORS[deviceIdx % COLORS.length] }}>{device.deviceName || device.qrCode}</strong>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Location:</strong> {loc.locationName || 'Unknown'}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Latitude:</strong> {loc.latitude.toFixed(6)}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Longitude:</strong> {loc.longitude.toFixed(6)}
                        </div>
                        {loc.lastUpdated && (
                          <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                            Last Updated: {new Date(loc.lastUpdated).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))
              )
            )}
          </MapContainer>
        </Box>
      </Paper>
      {/* Device Route/History Map or Details */}
      {selectedDevice && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Device Route/History for QR: {selectedDevice.qrCode}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Filter by date range:</Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={setToday}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={setPreviousDay}
                  >
                    Previous Day
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: { width: '160px' }
                      }
                    }}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: { width: '160px' }
                      }
                    }}
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    sx={{ ml: 1 }}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Box>
            </LocalizationProvider>
          </Box>
          <Box sx={{ height: '400px', width: '100%' }}>
            <MapContainer
              center={selectedDevice.currentLocation ? [selectedDevice.currentLocation.latitude, selectedDevice.currentLocation.longitude] : [0,0]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {(() => {
                const history = deviceHistories[selectedDevice._id] || [];
                const filteredHistory = history.filter(loc => {
                  if (!loc || !loc.lastUpdated) return false;
                  
                  const date = new Date(loc.lastUpdated);
                  date.setHours(0,0,0,0); // Normalize to start of day for comparison
                  
                  const start = startDate ? new Date(startDate) : null;
                  const end = endDate ? new Date(endDate) : null;
                  
                  if (start) {
                    start.setHours(0,0,0,0);
                    const startTime = start.getTime();
                    if (date.getTime() < startTime) return false;
                  }
                  
                  if (end) {
                    end.setHours(0,0,0,0);
                    const endTime = end.getTime();
                    if (date.getTime() > endTime) return false;
                  }
                  
                  return true;
                });
                
                // Update markers to show filtered data only
                if (filteredHistory.length === 0) {
                  return (
                    <Typography
                      variant="body1"
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      No location data available for selected date range
                    </Typography>
                  );
                }
                return filteredHistory.length > 0 && (
                  <>
                    <Polyline
                      positions={filteredHistory.map(loc => [loc.latitude, loc.longitude])}
                      color="#1976d2"
                      weight={5}
                      opacity={0.8}
                    />
                    {filteredHistory.map((loc, idx) => (
                      <Marker key={idx} position={[loc.latitude, loc.longitude]}>
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <div style={{ marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                              <strong style={{ color: '#1976d2' }}>Location Details</strong>
                            </div>
                            <strong>Latitude:</strong> {loc.latitude.toFixed(6)}<br/>
                            <strong>Longitude:</strong> {loc.longitude.toFixed(6)}<br/>
                            <strong>Time:</strong> {loc.lastUpdated ? new Date(loc.lastUpdated).toLocaleString() : '-'}
                            {(startDate || endDate) && (
                              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                <strong>Filtered Date Range:</strong><br/>
                                {startDate ? new Date(startDate).toLocaleDateString() : 'Start'} - {endDate ? new Date(endDate).toLocaleDateString() : 'End'}
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </>
                );
              })()}
            </MapContainer>
          </Box>
        </Box>
      )}
      {/* Device Locations Cards */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Device Locations</Typography>
      <Typography variant="body2" color="secondary" sx={{ mb: 2 }}>
        Rendering {devices.filter(device => device.isOnline && device.isActive && device.userId && device.userId.name && device.userId.name !== 'N/A').length} devices
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {devices
          .filter(device => device.isOnline && device.isActive && device.userId && device.userId.name && device.userId.name !== 'N/A')
          .map(device => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={device._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">QR Code</Typography>
                      <Typography variant="body2" color="text.secondary">{device.qrCode}</Typography>
                      <Typography variant="body2" color="text.secondary">User: {device.userId?.name || 'N/A'}</Typography>
                    </Box>
                    <Chip label={device.isOnline ? 'Online' : 'Offline'} color={device.isOnline ? 'success' : 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    {device.currentLocation && device.currentLocation.locationName ? (
                      <>
                        {device.currentLocation.locationName}
                      </>
                    ) : ' '}
                  </Typography>
                  <Typography variant="body2"><strong>Latitude:</strong> {device.currentLocation && device.currentLocation.latitude != null ? device.currentLocation.latitude : 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Longitude:</strong> {device.currentLocation && device.currentLocation.longitude != null ? device.currentLocation.longitude : 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Last Updated:</strong> {device.currentLocation && device.currentLocation.lastUpdated ? new Date(device.currentLocation.lastUpdated).toLocaleString() : 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {device.isActive ? 'Active' : 'Inactive'}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => handleViewMap(device)}>View Map</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};

export default DeviceLocationMap;