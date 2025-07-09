import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  AppBar,
  Toolbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Avatar,
  TextField,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Skeleton,
  Drawer,
  Divider,
  Grid,
  InputLabel
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import DeviceLocationMap from '../components/DeviceLocationMap';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCount, setQrCount] = useState(1);
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);
  const [historyTabUser, setHistoryTabUser] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyEntityType, setHistoryEntityType] = useState('user'); // 'user' or 'device'
  const [historyTabDevice, setHistoryTabDevice] = useState('');
  const [devices, setDevices] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users/with-devices', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch users');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleViewQR = (user) => {
    setSelectedUser(user);
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
  };

  // Helper to generate a random 16-digit number as a string
  const generateUniqueCode = () => {
    let code = '';
    for (let i = 0; i < 16; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  };

  const handleGenerateQRCodes = async () => {
    setGenerateLoading(true);
    setGeneratedQRCodes([]); // Clear previous codes
    try {
      const res = await axios.post('http://localhost:5000/api/qrcodes/generate', { count: qrCount });
      setGeneratedQRCodes(res.data.codes);
    } catch (err) {
      // You can add an error state here to show messages to the admin
      console.error("Failed to generate QR codes", err);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setAddUserForm({ name: '', email: '', password: '', role: 'user' });
    setAddUserError('');
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => setAddDialogOpen(false);

  const handleAddUserChange = (e) => {
    setAddUserForm({ ...addUserForm, [e.target.name]: e.target.value });
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', { ...addUserForm });
      setAddUserLoading(false);
      setAddDialogOpen(false);
      fetchUsers(); // Refresh user list
    } catch (err) {
      setAddUserError(err.response?.data?.msg || 'Failed to add user.');
      setAddUserLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filtering and sorting logic
  const filteredUsers = users
    .filter(user =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter ? user.role === roleFilter : true) &&
      (statusFilter ? (statusFilter === 'online' ? user.isOnline : !user.isOnline) : true)
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === 'lastLogin' || sortConfig.key === 'createdAt') {
        aValue = aValue ? new Date(aValue) : 0;
        bValue = bValue ? new Date(bValue) : 0;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleOpenDetailDrawer = (user) => {
    setDrawerUser(user);
    setDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setDrawerUser(null);
  };

  // Fetch location history for a user
  const fetchLocationHistory = async (userId) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:5000/api/locations/history/${userId}`;
      
      // Add date parameters if they exist
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await axios.get(url, {
        headers: { 'x-auth-token': token }
      });
      setLocationHistory(res.data);
    } catch (err) {
      setHistoryError(err.response?.data?.msg || 'Failed to fetch location history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch devices for device dropdown
  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/devices/all-locations', {
        headers: { 'x-auth-token': token }
      });
      setDevices(res.data);
    } catch (err) {
      // ignore for now
    }
  };

  useEffect(() => {
    if (activeTab === 4) fetchDevices();
  }, [activeTab]);

  // Fetch device location history
  const fetchDeviceLocationHistory = async (deviceId) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:5000/api/devices/${deviceId}/history`;
      
      // Add date parameters if they exist
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await axios.get(url, {
        headers: { 'x-auth-token': token }
      });
      setLocationHistory(res.data);
    } catch (err) {
      setHistoryError(err.response?.data?.msg || 'Failed to fetch device location history');
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/profile">Profile</Button>
          <Avatar src={user?.avatar || undefined} alt={user?.name} sx={{ ml: 2, width: 36, height: 36 }} />
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{
        minHeight: '100vh',
        py: 4,
        backgroundColor: '#f8f9fa',
      }}>
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
          <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
            Welcome, {user?.name}
          </Typography>
          <Typography variant="body1" sx={{ color: '#5a6c7d' }}>
            You have admin access to view all registered users and track their locations.
          </Typography>
        </Paper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: '#fff3f3', border: '1px solid #ffcdd2' }}>
            {error}
          </Alert>
        )}

        {/* Tab Navigation */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
            sx={{
              mb: 3,
              '.MuiTabs-indicator': {
                backgroundColor: '#2c3e50',
                height: 3,
              },
              '.MuiTab-root': {
                fontWeight: 500,
                fontSize: '1rem',
                textTransform: 'none',
                px: 3,
                color: '#5a6c7d',
                '&.Mui-selected': {
                  color: '#2c3e50',
                  fontWeight: 600,
                },
              },
            }}
          >
            <Tab label="User Management" />
            <Tab label="Location Tracking" />
            <Tab label="QR Code Generator" />
            <Tab label="All QR Codes" />
            <Tab label="History" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6">User Management</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                    sx={{ minWidth: 220 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="superadmin">Super Admin</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="online">Online</MenuItem>
                      <MenuItem value="offline">Offline</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" color="primary" onClick={handleOpenAddDialog}>Add User</Button>
                </Box>
              </Box>
            </Paper>
            
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, boxShadow: 2 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                      Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell onClick={() => handleSort('email')} sx={{ cursor: 'pointer' }}>
                      Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell onClick={() => handleSort('role')} sx={{ cursor: 'pointer' }}>
                      Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell>Unique Code</TableCell>
                    <TableCell onClick={() => handleSort('createdAt')} sx={{ cursor: 'pointer' }}>
                      Created At {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell onClick={() => handleSort('lastLogin')} sx={{ cursor: 'pointer' }}>
                      Last Login {sortConfig.key === 'lastLogin' && (sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    </TableCell>
                    <TableCell>Login Count</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetailDrawer(user)}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.uniqueCode}</TableCell>
                      <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleString() : ''}</TableCell>
                      <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : ''}</TableCell>
                      <TableCell>{user.loginCount || 0}</TableCell>
                      <TableCell>
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => handleViewQR(user)}
                        >
                          View QR
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Distance Statistics */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
              <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>Distance Statistics</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 3, backgroundColor: '#2c3e50', borderRadius: 2, color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {users.reduce((sum, user) => sum + (user.totalDistance || 0), 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2">Total User Distance (km)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 3, backgroundColor: '#34495e', borderRadius: 2, color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {users.reduce((sum, user) => {
                        return sum + (user.devices || []).reduce((deviceSum, device) => {
                          return deviceSum + (device.totalDistance || 0);
                        }, 0);
                      }, 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2">Total Device Distance (km)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 3, backgroundColor: '#27ae60', borderRadius: 2, color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {users.filter(u => u.isOnline).length}
                    </Typography>
                    <Typography variant="body2">Online Users</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 3, backgroundColor: '#3498db', borderRadius: 2, color: 'white' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {users.reduce((sum, user) => sum + (user.devices ? user.devices.length : 0), 0)}
                    </Typography>
                    <Typography variant="body2">Total Devices</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Device Map */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <DeviceLocationMap />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Generate QR Codes</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                label="Number of QR Codes"
                value={qrCount}
                onChange={e => setQrCount(Math.max(1, parseInt(e.target.value) || 1))}
                size="small"
                sx={{ width: 180 }}
                inputProps={{ min: 1 }}
              />
              <Button variant="contained" onClick={handleGenerateQRCodes} disabled={generateLoading}>
                {generateLoading ? 'Generating...' : 'Generate'}
              </Button>
            </Box>
            {generatedQRCodes.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {generatedQRCodes.map((code, idx) => (
                  <Box key={code + idx} sx={{ textAlign: 'center' }}>
                    <QRCodeSVG id={`qr-svg-${idx}`} value={code} size={200} />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>{code}</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={async () => {
                        const svgElement = document.getElementById(`qr-svg-${idx}`);
                        const serializer = new XMLSerializer();
                        const svgString = serializer.serializeToString(svgElement);
                        const svg64 = btoa(unescape(encodeURIComponent(svgString)));
                        const image64 = 'data:image/svg+xml;base64,' + svg64;
                        const img = new window.Image();
                        img.onload = function () {
                          const canvas = document.createElement('canvas');
                          canvas.width = 200;
                          canvas.height = 200;
                          const ctx = canvas.getContext('2d');
                          ctx.fillStyle = '#fff';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          ctx.drawImage(img, 0, 0);
                          canvas.toBlob((blob) => {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `qr-code-${code}.png`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }, 'image/png');
                        };
                        img.src = image64;
                      }}
                    >Download</Button>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>All QR Codes (Main & Devices)</Typography>
            <Grid container spacing={3} alignItems="stretch">
              {users.map((user) => (
                <Grid item key={user._id} xs={12} sm={6} md={4} lg={3}>
                  <Paper sx={{
                    p: 3,
                    minHeight: 340,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: 3,
                    borderRadius: 3,
                  }} elevation={3}>
                    <Box sx={{ width: '100%', textAlign: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>{user.name}</Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>{user.email}</Typography>
                      <Typography variant="body2" color="text.secondary">Role: {user.role}</Typography>
                    </Box>
                    <Divider sx={{ my: 1, width: '100%' }} />
                    <Box sx={{ width: '100%', textAlign: 'center', mb: 2 }}>
                      <Typography variant="caption" fontWeight="bold">Main QR</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 2, width: 'fit-content', mx: 'auto' }}>
                        <QRCodeSVG value={user.uniqueCode} size={64} />
                      </Box>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 1, mt: 1 }}>{user.uniqueCode}</Typography>
                    </Box>
                    {user.devices && user.devices.length > 0 && (
                      <Box sx={{ width: '100%', textAlign: 'center', mt: 1 }}>
                        <Typography variant="caption" fontWeight="bold">Device QRs</Typography>
                        <Box sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: 2,
                          mt: 1,
                          p: 1,
                          bgcolor: '#f5f5f5',
                          borderRadius: 2,
                          minHeight: 60,
                          maxHeight: 120,
                          overflowY: 'auto',
                        }}>
                          {user.devices.map((device, idx) => (
                            device.isOnline && device.isTracking && device.isActive ? (
                              <Box key={device.qrCode + idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 56 }}>
                                <QRCodeSVG value={device.qrCode} size={48} />
                                <Typography variant="caption" sx={{ fontSize: 10 }}>Device {idx + 1}</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 1, fontSize: 12, mt: 0.5 }}>{device.qrCode}</Typography>
                                <Typography variant="caption" sx={{ fontSize: 10, color: 'primary.main' }}>
                                  {(device.totalDistance || 0).toFixed(2)} km
                                </Typography>
                              </Box>
                            ) : null
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>Location History</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 120 }} size="small">
                <Select
                  value={historyEntityType}
                  onChange={e => {
                    setHistoryEntityType(e.target.value);
                    setHistoryTabUser('');
                    setHistoryTabDevice('');
                    setLocationHistory([]);
                  }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="device">Device</MenuItem>
                </Select>
              </FormControl>
              {historyEntityType === 'user' ? (
                <FormControl sx={{ minWidth: 240 }} size="small">
              <Select
                value={historyTabUser || ''}
                displayEmpty
                onChange={e => {
                  setHistoryTabUser(e.target.value);
                      setLocationHistory([]);
                  if (e.target.value) fetchLocationHistory(e.target.value);
                }}
              >
                <MenuItem value=""><em>Select User</em></MenuItem>
                {users.map(u => (
                  <MenuItem key={u._id} value={u._id}>{u.name} ({u.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
              ) : (
                <FormControl sx={{ minWidth: 240 }} size="small">
                  <Select
                    value={historyTabDevice || ''}
                    displayEmpty
                    onChange={e => {
                      setHistoryTabDevice(e.target.value);
                      setLocationHistory([]);
                      if (e.target.value) fetchDeviceLocationHistory(e.target.value);
                    }}
                  >
                    <MenuItem value=""><em>Select Device</em></MenuItem>
                    {devices.map(d => (
                      <MenuItem key={d._id} value={d._id}>{d.qrCode} ({d.userId?.name || 'No User'})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newDate) => {
                    setStartDate(newDate);
                    if (historyEntityType === 'device' && historyTabDevice) {
                      fetchDeviceLocationHistory(historyTabDevice);
                    } else if (historyEntityType === 'user' && historyTabUser) {
                      fetchLocationHistory(historyTabUser);
                    }
                  }}
                  renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 140 }} />}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newDate) => {
                    setEndDate(newDate);
                    if (historyEntityType === 'device' && historyTabDevice) {
                      fetchDeviceLocationHistory(historyTabDevice);
                    } else if (historyEntityType === 'user' && historyTabUser) {
                      fetchLocationHistory(historyTabUser);
                    }
                  }}
                  renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 140 }} />}
                />
              </LocalizationProvider>
              {locationHistory.length > 0 && (
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', px: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                  Total Distance: {(() => {
                    // Filter valid points and by date
                    const validHistory = locationHistory.filter(
                      loc => loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number' &&
                        (!startDate || new Date(loc.timestamp || loc.lastUpdated) >= new Date(startDate)) &&
                        (!endDate || new Date(loc.timestamp || loc.lastUpdated) <= new Date(endDate))
                    );
                    if (validHistory.length < 2) return '0.00';
                    let total = 0;
                    for (let i = 1; i < validHistory.length; i++) {
                      const R = 6371;
                      const dLat = (validHistory[i].latitude - validHistory[i-1].latitude) * Math.PI / 180;
                      const dLon = (validHistory[i].longitude - validHistory[i-1].longitude) * Math.PI / 180;
                      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(validHistory[i-1].latitude * Math.PI / 180) * Math.cos(validHistory[i].latitude * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      total += R * c;
                    }
                    return total.toFixed(2);
                  })()} km
                </Typography>
              )}
            </Box>
            {historyLoading ? (
              <CircularProgress />
            ) : historyError ? (
              <Alert severity="error">{historyError}</Alert>
            ) : locationHistory.length > 0 ? (
              <Box sx={{ height: 400, width: '100%', mt: 2 }}>
                {(() => {
                  // Filter valid points and by date
                  const isSameDay = (d1, d2) => {
                    const date1 = new Date(d1);
                    const date2 = new Date(d2);
                    return (
                      date1.getFullYear() === date2.getFullYear() &&
                      date1.getMonth() === date2.getMonth() &&
                      date1.getDate() === date2.getDate()
                    );
                  };
                  const validHistory = locationHistory.filter(loc => {
                    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return false;
                    if (startDate && endDate && (new Date(startDate).toDateString() === new Date(endDate).toDateString())) {
                      // Only show points that match the selected day
                      return isSameDay(loc.timestamp || loc.lastUpdated, startDate);
                    }
                    if (startDate && (!endDate || new Date(startDate) > new Date(endDate))) {
                      return isSameDay(loc.timestamp || loc.lastUpdated, startDate);
                    }
                    if (endDate && (!startDate || new Date(endDate) < new Date(startDate))) {
                      return isSameDay(loc.timestamp || loc.lastUpdated, endDate);
                    }
                    // Default: range filter
                    return (!startDate || new Date(loc.timestamp || loc.lastUpdated) >= new Date(startDate)) &&
                      (!endDate || new Date(loc.timestamp || loc.lastUpdated) <= new Date(endDate));
                  });
                  if (validHistory.length === 0) {
                    return <Typography variant="body2" sx={{ mt: 2 }}>No valid location history found for this selection and date range.</Typography>;
                  }
                  return (
                <MapContainer
                  center={[
                        validHistory[0].latitude,
                        validHistory[0].longitude
                  ]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                      {validHistory.length > 1 && (
                  <Polyline
                          positions={validHistory.map(loc => [loc.latitude, loc.longitude])}
                    color="#2196f3"
                    weight={4}
                    opacity={0.7}
                  />
                      )}
                      {validHistory.length > 1 && (() => {
                        const mid = validHistory[Math.floor(validHistory.length / 2)];
                        if (mid && typeof mid.latitude === 'number' && typeof mid.longitude === 'number') {
                          return (
                            <Marker
                              position={[mid.latitude, mid.longitude]}
                              icon={L.divIcon({
                                className: 'distance-marker',
                                html: `<div style=\"background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap;\">${(() => {
                                  let total = 0;
                                  for (let i = 1; i < validHistory.length; i++) {
                                    const R = 6371;
                                    const dLat = (validHistory[i].latitude - validHistory[i-1].latitude) * Math.PI / 180;
                                    const dLon = (validHistory[i].longitude - validHistory[i-1].longitude) * Math.PI / 180;
                                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                      Math.cos(validHistory[i-1].latitude * Math.PI / 180) * Math.cos(validHistory[i].latitude * Math.PI / 180) *
                                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                    total += R * c;
                                  }
                                  return total.toFixed(2);
                                })()} km</div>`
                              })}
                            />
                          );
                        }
                        return null;
                      })()}
                      {validHistory.map((loc, idx) => (
                    <Marker
                      key={idx}
                      position={[loc.latitude, loc.longitude]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style=\"background-color: #2196f3; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;\"></div>`
                      })}
                    >
                      <Popup>
                        <div style={{ minWidth: '150px' }}>
                          <strong>Time:</strong> {loc.timestamp ? new Date(loc.timestamp).toLocaleString() : '-'}<br />
                          <strong>Lat:</strong> {loc.latitude}<br />
                          <strong>Lng:</strong> {loc.longitude}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                  );
                })()}
              </Box>
            ) : (historyTabUser || historyTabDevice) ? (
              <Typography variant="body2" sx={{ mt: 2 }}>No location history found for this selection.</Typography>
            ) : null}
          </Box>
        )}
      </Container>
      
      <Dialog open={qrDialogOpen} onClose={handleCloseQrDialog}>
        <DialogTitle>User QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedUser?.name}'s QR Code
            </Typography>
            <Box sx={{ my: 2 }}>
              {selectedUser && (
                <QRCodeSVG value={selectedUser.uniqueCode} size={200} />
              )}
            </Box>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
              {selectedUser?.uniqueCode}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQrDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddUserSubmit} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Name"
              type="text"
              fullWidth
              variant="outlined"
              value={addUserForm.name}
              onChange={handleAddUserChange}
              required
            />
            <TextField
              margin="dense"
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={addUserForm.email}
              onChange={handleAddUserChange}
              required
            />
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={addUserForm.password}
              onChange={handleAddUserChange}
              required
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={addUserForm.role || 'user'}
                label="Role"
                onChange={handleAddUserChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </Select>
            </FormControl>
            {addUserError && <Alert severity="error" sx={{ mt: 2 }}>{addUserError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button type="submit" onClick={handleAddUserSubmit} variant="contained" disabled={addUserLoading}>
            {addUserLoading ? 'Adding...' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={handleCloseDetailDrawer}
        sx={{ zIndex: 1301 }}
      >
        <Box sx={{ width: { xs: 300, sm: 400 }, p: 3 }}>
          {drawerUser ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={drawerUser.avatar || undefined} alt={drawerUser.name} sx={{ width: 56, height: 56 }} />
                <Box>
                  <Typography variant="h6">{drawerUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{drawerUser.email}</Typography>
                  <Typography variant="body2" color="text.secondary">Role: {drawerUser.role}</Typography>
                  <Typography variant="body2" color="text.secondary">Unique Code: {drawerUser.uniqueCode}</Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Account Info</Typography>
              <Typography variant="body2">Created At: {drawerUser.createdAt ? new Date(drawerUser.createdAt).toLocaleString() : '-'}</Typography>
              <Typography variant="body2">Last Login: {drawerUser.lastLogin ? new Date(drawerUser.lastLogin).toLocaleString() : '-'}</Typography>
              <Typography variant="body2">Login Count: {drawerUser.loginCount || 0}</Typography>
              <Typography variant="body2">Status: {drawerUser.isOnline ? 'Online' : 'Offline'}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>QR Codes</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption">Main:</Typography>
                <QRCodeSVG value={drawerUser.uniqueCode} size={64} />
              </Box>
              {drawerUser.devices && drawerUser.devices.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {drawerUser.devices.map((device, idx) => (
                    <Box key={device.qrCode + idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption">Device {idx + 1}:</Typography>
                      <QRCodeSVG value={device.qrCode} size={48} />
                      <Typography variant="caption" color="primary.main">
                        {(device.totalDistance || 0).toFixed(2)} km
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Quick Actions</Typography>
              <Button variant="outlined" color="primary" sx={{ mb: 1, width: '100%' }}>Reset Password</Button>
              <Button variant="outlined" color="secondary" sx={{ mb: 1, width: '100%' }}>View Location History</Button>
              <Button variant="outlined" color="error" sx={{ width: '100%' }}>Deactivate User</Button>
            </>
          ) : (
            <Typography variant="body1">No user selected.</Typography>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default AdminDashboard;