import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { LocationOn, LocationOff, MyLocation, Edit, Search } from '@mui/icons-material';
import locationService from '../services/locationService';
import axios from 'axios';

const LocationTracker = () => {
  const { user } = useContext(AuthContext);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [manualLocationDialog, setManualLocationDialog] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    // Cleanup function to clear location watching when component unmounts
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  useEffect(() => {
    // Fetch user info from backend and set state
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { 'x-auth-token': token }
        });
        if (res.data.currentLocation) {
          setCurrentLocation(res.data.currentLocation);
          setLocationName(res.data.currentLocation.locationName || '');
        }
        setIsTracking(res.data.isTracking);
        // Do NOT auto-start GPS tracking; only do so if user clicks Start Tracking
      } catch (err) {}
    };
    fetchUserInfo();
  }, []);

  const startLocationTracking = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get initial location
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      setLocationName('');
      // Update location on server
      await locationService.updateLocation(user._id, { ...location, isTracking: true, locationType: 'gps' });
      setLastUpdate(new Date());
      setSuccess('Location tracking started successfully!');

      // Start watching location
      const newWatchId = locationService.watchLocation(
        async (newLocation) => {
          setCurrentLocation(newLocation);
          setLocationName('');
          try {
            await locationService.updateLocation(user._id, { ...newLocation, isTracking: true, locationType: 'gps' });
            setLastUpdate(new Date());
          } catch (err) {
            console.error('Failed to update location:', err);
          }
        },
        (err) => {
          setError(`Location tracking error: ${err.message}`);
          setIsTracking(false);
        }
      );

      setWatchId(newWatchId);
      setIsTracking(true);
    } catch (err) {
      setError(`Failed to start location tracking: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stopLocationTracking = async () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    try {
      await locationService.markUserOffline(user._id);
      setSuccess('Location tracking stopped successfully!');
    } catch (err) {
      setError(`Failed to stop location tracking: ${err.message}`);
    }

    setIsTracking(false);
    // Do NOT clear currentLocation; keep last known location
    setLastUpdate(null);
  };

  const updateLocationOnce = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      await locationService.updateLocation(user._id, { ...location, isTracking: false, locationType: 'gps' });
      setLastUpdate(new Date());
      setSuccess('Location updated successfully!');
    } catch (err) {
      setError(`Failed to update location: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingToggle = () => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  const searchLocation = async () => {
    if (!locationSearch.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      const results = await locationService.searchLocation(locationSearch);
      setSearchResults(results);
    } catch (err) {
      setError(`Failed to search location: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = async (location) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update location on server
      await locationService.updateLocation(user._id, {
        latitude: Number(location.lat),
        longitude: Number(location.lon),
        locationName: location.display_name,
        isTracking: false,
        locationType: 'manual'
      });

      setCurrentLocation({
        latitude: Number(location.lat),
        longitude: Number(location.lon),
        locationName: location.display_name,
        locationType: 'manual'
      });
      setLocationName(location.display_name);
      setIsTracking(false);
      setLastUpdate(new Date());
      setSuccess('Manual location updated successfully!');
      setManualLocationDialog(false);
      setLocationSearch('');
      setSearchResults([]);
    } catch (err) {
      setError(`Failed to update manual location: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openManualLocationDialog = () => {
    setManualLocationDialog(true);
    setLocationSearch('');
    setSearchResults([]);
  };

  const closeManualLocationDialog = () => {
    setManualLocationDialog(false);
    setLocationSearch('');
    setSearchResults([]);
  };

  return (
    <Card sx={{ p: 0, borderRadius: 3, boxShadow: 3, bgcolor: '#f8fbff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#1976d2', color: 'white', px: 3, py: 2, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
        <LocationOn sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight="bold">Location Tracking</Typography>
      </Box>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Share your location with the admin to enable real-time tracking. Your location will be updated every 5 seconds when tracking is active.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            color={isTracking ? 'error' : 'primary'}
            startIcon={isTracking ? <LocationOff /> : <LocationOn />}
            onClick={handleTrackingToggle}
            disabled={loading}
            sx={{ minWidth: 160 }}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<MyLocation />}
            onClick={updateLocationOnce}
            disabled={loading}
          >
            Update Location Once
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={openManualLocationDialog}
            disabled={loading}
          >
            Set Manual Location
          </Button>
          <FormControlLabel
            control={<Switch checked={isTracking} onChange={handleTrackingToggle} color="primary" />}
            label={<Typography variant="body2">Continuous Tracking</Typography>}
            sx={{ ml: 2 }}
          />
        </Box>
        <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, border: '1px solid #e0e0e0', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Current Location</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><strong>Latitude:</strong> {currentLocation?.latitude ?? '-'}</Typography>
            <Typography variant="body2"><strong>Longitude:</strong> {currentLocation?.longitude ?? '-'}</Typography>
            {currentLocation?.locationName && (
              <Typography variant="body2" color="primary"><LocationOn sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> {currentLocation.locationName}</Typography>
            )}
          </Box>
          {isTracking && <Chip label="Live" color="success" size="small" sx={{ fontWeight: 'bold', fontSize: 14 }} />}
        </Box>
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> Location tracking requires permission from your browser. Make sure to allow location access when prompted. You can also manually set your location if GPS is inaccurate.
        </Typography>
      </CardContent>

      {/* Manual Location Dialog */}
      <Dialog 
        open={manualLocationDialog} 
        onClose={closeManualLocationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Manual Location</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a location name (e.g., "Times Square, New York" or "Eiffel Tower, Paris") and select from the search results.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Search Location"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Enter location name..."
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <Button
              variant="contained"
              onClick={searchLocation}
              disabled={!locationSearch.trim() || searching}
              startIcon={<Search />}
            >
              {searching ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Box>

          {searchResults.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Search Results:
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
                {searchResults.map((result, index) => (
                  <React.Fragment key={index}>
                    <ListItem 
                      button 
                      onClick={() => selectLocation(result)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <ListItemText
                        primary={result.display_name}
                        secondary={`${Number(result.lat).toFixed(6)}, ${Number(result.lon).toFixed(6)}`}
                      />
                    </ListItem>
                    {index < searchResults.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          {searchResults.length === 0 && locationSearch && !searching && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No locations found. Try a different search term.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeManualLocationDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default LocationTracker; 