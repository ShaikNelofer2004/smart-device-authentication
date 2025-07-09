import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import QRCodeDisplay from '../components/QRCodeDisplay';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  AppBar,
  Toolbar,
  Avatar,
  Card,
  CardContent,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider as MuiDivider,
  TextField,
  Alert,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import DevicesIcon from '@mui/icons-material/Devices';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import LocationTracker from '../components/LocationTracker';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

const UserDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [recentActivity] = useState([
    { action: 'Logged in', date: new Date().toLocaleString() },
    { action: 'Viewed QR code', date: new Date(Date.now() - 3600000).toLocaleString() },
    { action: 'Updated profile', date: new Date(Date.now() - 7200000).toLocaleString() },
  ]);
  const [accountStats] = useState({
    createdAt: user?.createdAt,
    lastLogin: new Date().toLocaleString(),
    loginCount: 12,
  });
  const [addDeviceCode, setAddDeviceCode] = useState('');
  const [addDeviceLoading, setAddDeviceLoading] = useState(false);
  const [addDeviceSuccess, setAddDeviceSuccess] = useState('');
  const [addDeviceError, setAddDeviceError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || undefined);

  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader', 
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      false
    );

    const onScanSuccess = (decodedText) => {
      setAddDeviceCode(decodedText);
      setShowScanner(false);
      scanner.clear();
    };

    const onScanFailure = (error) => {
      // console.warn(`QR scan error: ${error}`);
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      // Ensure scanner is cleared when component unmounts or scanner is hidden.
      if (scanner && scanner.getState() !== 3) { // 3 is CLEARED state
        scanner.clear();
      }
    };
  }, [showScanner]);

  // Simulate loading for 1s
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Profile completeness calculation
  const profileFields = [user?.name, user?.email, avatarUrl, user?.uniqueCode];
  const completeness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  // Avatar upload handler (simulate upload)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    // Simulate upload
    setTimeout(() => {
      setAvatarUrl(URL.createObjectURL(file));
      setAvatarUploading(false);
    }, 1200);
  };

  const handleLogout = () => {
    logout();
  };

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

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 220,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 220,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #f7f9fb 100%)',
            boxShadow: '2px 0 12px rgba(106,130,251,0.08)',
          },
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
            <ListItem button component={Link} to="/profile">
              <ListItemIcon><LockIcon /></ListItemIcon>
              <ListItemText primary="Change Password" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, background: '#f7f9fb', minHeight: '100vh' }}>
        <Toolbar />
        <Grid container spacing={3} alignItems="stretch">
          {/* Profile Card */}
          <Grid item xs={12} md={5} lg={4}>
            <Card sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 4,
              mb: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 8,
              },
            }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar src={avatarUrl} alt={user?.name} sx={{ width: 96, height: 96, fontSize: 40, border: '4px solid #1976d2', bgcolor: '#e3f2fd' }} />
                <label htmlFor="avatar-upload">
                  <input
                    accept="image/*"
                    id="avatar-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'white', boxShadow: 1 }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>Welcome, {user?.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{user?.email}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Account Created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</Typography>
              <Box sx={{ width: '100%', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Profile Completeness</Typography>
                <LinearProgress variant="determinate" value={completeness} sx={{ height: 8, borderRadius: 5, mt: 0.5, bgcolor: '#e3f2fd' }} />
                <Typography variant="caption" color="text.secondary" sx={{ float: 'right', mt: 0.5 }}>{completeness}%</Typography>
              </Box>
              <Stack direction="row" spacing={2} sx={{ mt: 2, width: '100%' }}>
                <Button variant="contained" sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4,
                    background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                    color: 'white',
                  },
                }} fullWidth component={Link} to="/profile">Profile</Button>
                <Button variant="contained" sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4,
                    background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                    color: 'white',
                  },
                }} fullWidth component={Link} to="/profile">Change Password</Button>
                <Button variant="contained" sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4,
                    background: 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)',
                    color: 'white',
                  },
                }} fullWidth startIcon={<DownloadIcon />}>Download QR</Button>
              </Stack>
            </Card>
          </Grid>
          {/* QR Code Card */}
          <Grid item xs={12} md={4} lg={3}>
            <Card sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 4,
              mb: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 8,
              },
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Your Unique QR Code</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img src={user.qrCode} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              </Box>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>{user.uniqueCode}</Typography>
            </Card>
          </Grid>
          {/* Recent Activity & Stats */}
          <Grid item xs={12} md={3} lg={2}>
            <Stack spacing={2}>
              <Card sx={{
                p: 2,
                borderRadius: 3,
                boxShadow: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 4,
                },
              }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Recent Activity</Typography>
                <Divider sx={{ mb: 1 }} />
                {recentActivity.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 1 }}>
                    <Typography variant="body2">{item.action}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.date}</Typography>
                  </Box>
                ))}
              </Card>
              <Card sx={{
                p: 2,
                borderRadius: 3,
                boxShadow: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 4,
                },
              }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Account Stats</Typography>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="body2">Account Created: {accountStats.createdAt ? new Date(accountStats.createdAt).toLocaleDateString() : '-'}</Typography>
                <Typography variant="body2">Last Login: {accountStats.lastLogin}</Typography>
                <Typography variant="body2">Login Count: {accountStats.loginCount}</Typography>
              </Card>
            </Stack>
          </Grid>
        </Grid>
        {/* Location Tracking & Add Device Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 3,
              mb: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 4,
              },
            }}>
              <LocationTracker />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default UserDashboard;