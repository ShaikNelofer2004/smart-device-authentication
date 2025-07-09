import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Drawer,
  Toolbar,
  ListItemIcon,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import DevicesIcon from '@mui/icons-material/Devices';
import { QRCodeSVG } from 'qrcode.react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

const MyDevices = () => {
  const { user, logout } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tracking state for each device (persisted in localStorage)
  const [tracking, setTracking] = useState(() => {
    const saved = localStorage.getItem('deviceTracking');
    return saved ? JSON.parse(saved) : {};
  });
  const trackingIntervals = useRef({});

  // Save tracking state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('deviceTracking', JSON.stringify(tracking));
  }, [tracking]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(trackingIntervals.current).forEach(clearInterval);
    };
  }, []);

  // Start tracking for a device
  const startTracking = (deviceId) => {
    if (tracking[deviceId]) return;
    setTracking(prev => ({ ...prev, [deviceId]: true }));
    // Start interval
    trackingIntervals.current[deviceId] = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/devices/${deviceId}/location`, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              locationType: 'gps',
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            // Optionally handle error
          }
        });
      }
    }, 5000); // 5 seconds
  };

  // Stop tracking for a device
  const stopTracking = async (deviceId) => {
    setTracking(prev => {
      const updated = { ...prev };
      delete updated[deviceId];
      return updated;
    });
    if (trackingIntervals.current[deviceId]) {
      clearInterval(trackingIntervals.current[deviceId]);
      delete trackingIntervals.current[deviceId];
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/devices/${deviceId}/offline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optionally refresh device list
      setLoading(true);
      axios.get('http://localhost:5000/api/devices').then(res => setDevices(res.data)).finally(() => setLoading(false));
    } catch (err) {
      // Optionally handle error
    }
  };

  const [addDeviceCode, setAddDeviceCode] = useState('');
  const [addDeviceLoading, setAddDeviceLoading] = useState(false);
  const [addDeviceSuccess, setAddDeviceSuccess] = useState('');
  const [addDeviceError, setAddDeviceError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Scanner logic (copied from UserDashboard)
  useEffect(() => {
    if (!showScanner) return;
    let scanner;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      const onScanSuccess = (decodedText) => {
        setAddDeviceCode(decodedText);
        setShowScanner(false);
        scanner.clear();
      };
      const onScanFailure = (error) => {};
      scanner.render(onScanSuccess, onScanFailure);
    });
    return () => {
      if (scanner && scanner.getState && scanner.getState() !== 3) {
        scanner.clear();
      }
    };
  }, [showScanner]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setAddDeviceLoading(true);
    setAddDeviceSuccess('');
    setAddDeviceError('');
    try {
      const res = await axios.post('http://localhost:5000/api/devices/add', { qrCode: addDeviceCode });
      setAddDeviceSuccess(res.data.msg || 'Device added successfully!');
      setAddDeviceCode('');
    } catch (err) {
      setAddDeviceError(err.response?.data?.msg || 'Failed to add device.');
    } finally {
      setAddDeviceLoading(false);
    }
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/devices');
        setDevices(res.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch devices.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualDeviceId, setManualDeviceId] = useState(null);
  const [manualLocationName, setManualLocationName] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState([]);
  const [manualSearching, setManualSearching] = useState(false);
  const [manualSelectedResult, setManualSelectedResult] = useState(null);

  const handleOpenManualDialog = (deviceId) => {
    setManualDeviceId(deviceId);
    setManualLocationName('');
    setManualError('');
    setManualSuccess('');
    setManualDialogOpen(true);
    setManualSearchResults([]);
    setManualSelectedResult(null);
  };
  const handleCloseManualDialog = () => {
    setManualDialogOpen(false);
    setManualDeviceId(null);
    setManualLocationName('');
    setManualError('');
    setManualSuccess('');
    setManualSearchResults([]);
    setManualSelectedResult(null);
  };
  const handleManualSearch = async () => {
    setManualSearching(true);
    setManualError('');
    setManualSearchResults([]);
    setManualSelectedResult(null);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationName)}`);
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error('No results found');
      setManualSearchResults(geoData);
    } catch (err) {
      setManualError(err.message || 'Failed to search location.');
    } finally {
      setManualSearching(false);
    }
  };
  const handleManualLocationSubmit = async () => {
    if (!manualSelectedResult) return;
    setManualLoading(true);
    setManualError('');
    setManualSuccess('');
    try {
      const { lat, lon, display_name } = manualSelectedResult;
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/devices/${manualDeviceId}/location`, {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        locationName: display_name,
        locationType: 'manual',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManualSuccess('Location updated successfully!');
      setTimeout(() => {
        handleCloseManualDialog();
        setLoading(true);
        axios.get('http://localhost:5000/api/devices').then(res => setDevices(res.data)).finally(() => setLoading(false));
      }, 1000);
    } catch (err) {
      setManualError(err.message || 'Failed to update location.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 220,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 220, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button component={Link} to="/dashboard">
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/my-devices">
              <ListItemIcon><DevicesIcon /></ListItemIcon>
              <ListItemText primary="My Devices" />
            </ListItem>
            <ListItem button component={Link} to="/profile">
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button onClick={logout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {/* Add Device Section */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8} lg={6}>
            <Paper elevation={4} sx={{ p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AddCircleIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">Add a New Device</Typography>
              </Box>
              <Box component="form" onSubmit={handleAddDevice} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Enter 16-Digit QR Code *"
                  value={addDeviceCode}
                  onChange={(e) => setAddDeviceCode(e.target.value)}
                  variant="outlined"
                  required
                  sx={{ flexGrow: 1 }}
                  InputProps={{ startAdornment: <DevicesIcon sx={{ mr: 1 }} /> }}
                />
                <Button onClick={() => setShowScanner(prev => !prev)} variant="outlined" startIcon={<QrCodeScannerIcon />}>
                  {showScanner ? 'Close Scanner' : 'Scan QR'}
                </Button>
                <Button type="submit" variant="contained" color="primary" startIcon={<AddCircleIcon />} disabled={addDeviceLoading} sx={{ minWidth: 120 }}>
                  {addDeviceLoading ? 'Adding...' : 'Add Device'}
                </Button>
              </Box>
              {showScanner && <Box id="qr-reader" sx={{ width: '100%', mt: 2 }}></Box>}
              {addDeviceSuccess && <Alert severity="success" sx={{ mt: 2 }}>{addDeviceSuccess}</Alert>}
              {addDeviceError && <Alert severity="error" sx={{ mt: 2 }}>{addDeviceError}</Alert>}
            </Paper>
          </Grid>
        </Grid>
        {/* End Add Device Section */}
        <Typography variant="h4" gutterBottom>
          My Added Devices
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Paper>
            <List>
              {devices.map((device) => (
                <ListItem key={device._id} divider>
                  <Box sx={{ mr: 2 }}>
                    <QRCodeSVG value={device.qrCode} size={80} />
                  </Box>
                  <ListItemText
                    primary={`QR Code: ${device.qrCode}`}
                    secondary={`Added on: ${new Date(device.createdAt).toLocaleString()}`}
                  />
                  <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {tracking[device._id] ? (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={() => stopTracking(device._id)}
                      >
                        Stop Tracking
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => startTracking(device._id)}
                      >
                        Start Tracking
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenManualDialog(device._id)}
                      sx={{ mt: 1 }}
                    >
                      Update Location Manually
                    </Button>
                  </Box>
                </ListItem>
              ))}
              {devices.length === 0 && (
                <ListItem>
                  <ListItemText primary="You have not added any devices yet." />
                </ListItem>
              )}
            </List>
          </Paper>
        )}
        {/* Manual Location Dialog */}
        <Dialog open={manualDialogOpen} onClose={handleCloseManualDialog}>
          <DialogTitle>Set Manual Location</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Enter a location name (e.g., "Times Square, New York" or "Eiffel Tower, Paris") and select from the search results.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                autoFocus
                margin="dense"
                label="Search Location"
                type="text"
                fullWidth
                variant="outlined"
                value={manualLocationName}
                onChange={e => setManualLocationName(e.target.value)}
                disabled={manualLoading || manualSearching}
              />
              <Button
                variant="contained"
                onClick={handleManualSearch}
                disabled={!manualLocationName || manualLoading || manualSearching}
                sx={{ minWidth: 100 }}
              >
                {manualSearching ? 'Searching...' : 'Search'}
              </Button>
            </Box>
            {manualSearchResults.length > 0 && (
              <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                {manualSearchResults.map((result, idx) => (
                  <Paper
                    key={idx}
                    sx={{ p: 1, mb: 1, cursor: 'pointer', bgcolor: manualSelectedResult === result ? 'primary.light' : 'background.paper' }}
                    onClick={() => setManualSelectedResult(result)}
                    elevation={manualSelectedResult === result ? 4 : 1}
                  >
                    <Typography variant="subtitle2">{result.display_name}</Typography>
                    <Typography variant="caption">Lat: {result.lat}, Lon: {result.lon}</Typography>
                  </Paper>
                ))}
              </Box>
            )}
            {manualError && <Alert severity="error" sx={{ mt: 2 }}>{manualError}</Alert>}
            {manualSuccess && <Alert severity="success" sx={{ mt: 2 }}>{manualSuccess}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseManualDialog} disabled={manualLoading}>Cancel</Button>
            <Button onClick={handleManualLocationSubmit} variant="contained" disabled={manualLoading || !manualSelectedResult}>
              {manualLoading ? 'Updating...' : 'Update Location'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MyDevices; 