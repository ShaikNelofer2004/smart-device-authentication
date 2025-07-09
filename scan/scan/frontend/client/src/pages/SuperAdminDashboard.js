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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  TextField,
  Tabs,
  Tab,
  Grid,
  Divider
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', password: '' });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({ name: '', email: '', password: '' });
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [addAdminSuccess, setAddAdminSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);

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

  const handleOpenRoleDialog = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleCloseRoleDialog = () => {
    setRoleDialogOpen(false);
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  const handleUpdateRole = async () => {
    setIsUpdating(true);
    try {
      await axios.put(`http://localhost:5000/api/users/${selectedUser._id}/role`, {
        role: selectedRole
      });
      fetchUsers();
      setRoleDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:5000/api/users/${selectedUser._id}`);
      fetchUsers();
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddDialog = () => {
    setAddUserForm({ name: '', email: '', password: '' });
    setAddUserError('');
    setAddUserSuccess('');
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
    setAddUserSuccess('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        ...addUserForm,
        // role: 'user' // not needed, backend defaults to user
      });
      setAddUserSuccess('User added successfully!');
      setAddUserLoading(false);
      setAddDialogOpen(false);
      fetchUsers(); // refresh user list
    } catch (err) {
      setAddUserError(err.response?.data?.msg || 'Failed to add user.');
      setAddUserLoading(false);
    }
  };

  const handleOpenAddAdminDialog = () => {
    setAddAdminForm({ name: '', email: '', password: '' });
    setAddAdminError('');
    setAddAdminSuccess('');
    setAddAdminDialogOpen(true);
  };

  const handleCloseAddAdminDialog = () => setAddAdminDialogOpen(false);

  const handleAddAdminChange = (e) => {
    setAddAdminForm({ ...addAdminForm, [e.target.name]: e.target.value });
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    setAddAdminLoading(true);
    setAddAdminError('');
    setAddAdminSuccess('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        ...addAdminForm,
        role: 'admin'
      });
      setAddAdminSuccess('Admin added successfully!');
      setAddAdminLoading(false);
      setAddAdminDialogOpen(false);
      fetchUsers(); // refresh user list
    } catch (err) {
      setAddAdminError(err.response?.data?.msg || 'Failed to add admin.');
      setAddAdminLoading(false);
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
            Super Admin Dashboard
          </Typography>
          <Button color="inherit" component={Link} to="/profile">Profile</Button>
          <Avatar src={user?.avatar || undefined} alt={user?.name} sx={{ ml: 2, width: 36, height: 36 }} />
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{
        minHeight: '100vh',
        py: 5,
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f7f9fb 100%)',
      }}>
        <Paper elevation={4} sx={{ p: 3, borderRadius: 4, mb: 3, boxShadow: '0 4px 24px rgba(106,130,251,0.08)' }}>
          <Typography variant="h5" gutterBottom>Welcome, {user?.name}</Typography>
          <Typography variant="body1">You have superadmin access to manage all users.</Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2, mr: 2 }} onClick={handleOpenAddDialog}>Add User</Button>
          <Button variant="contained" color="secondary" sx={{ mt: 2 }} onClick={handleOpenAddAdminDialog}>Add Admin</Button>
        </Paper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          aria-label="superadmin dashboard tabs"
          sx={{
            mb: 3,
            '.MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%)',
              height: 4,
              borderRadius: 2,
            },
            '.MuiTab-root': {
              fontWeight: 600,
              fontSize: '1.1rem',
              textTransform: 'none',
              px: 3,
            },
          }}
        >
          <Tab label="User Management" />
          <Tab label="All QR Codes" />
        </Tabs>
        
        {activeTab === 0 && (
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, boxShadow: 2 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Unique Code</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.uniqueCode}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => handleViewQR(user)}
                        >
                          View QR
                        </Button>
                        {user.role !== 'superadmin' && (
                          <>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={() => handleOpenRoleDialog(user)}
                            >
                              Change Role
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error"
                              size="small" 
                              onClick={() => handleOpenDeleteDialog(user)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {activeTab === 1 && (
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
                          {user.devices.map((code, idx) => (
                            <Box key={code + idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 56 }}>
                              <QRCodeSVG value={code} size={48} />
                              <Typography variant="caption" sx={{ fontSize: 10 }}>Device {idx + 1}</Typography>
                            </Box>
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
      </Container>
      
      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={handleCloseQrDialog}>
        <DialogTitle>User QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedUser?.name}'s QR Code
            </Typography>
            <Box sx={{ my: 2 }}>
              {selectedUser && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption">Main:</Typography>
                    <QRCodeSVG value={selectedUser.uniqueCode} size={64} />
                  </Box>
                  {selectedUser.devices && selectedUser.devices.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedUser.devices.map((code, idx) => (
                        <Box key={code + idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption">Device:</Typography>
                          <QRCodeSVG value={code} size={48} />
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
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
      
      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={handleCloseRoleDialog}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 250, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={selectedRole}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateRole} 
            variant="contained" 
            disabled={isUpdating}
          >
            {isUpdating ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained" 
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddUserSubmit} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={addUserForm.name}
              onChange={handleAddUserChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Email"
              name="email"
              value={addUserForm.email}
              onChange={handleAddUserChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={addUserForm.password}
              onChange={handleAddUserChange}
              fullWidth
              margin="normal"
              required
            />
            {addUserError && <Alert severity="error" sx={{ mt: 2 }}>{addUserError}</Alert>}
            {addUserSuccess && <Alert severity="success" sx={{ mt: 2 }}>{addUserSuccess}</Alert>}
            <DialogActions sx={{ mt: 1 }}>
              <Button onClick={handleCloseAddDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={addUserLoading}>
                {addUserLoading ? 'Adding...' : 'Add User'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialogOpen} onClose={handleCloseAddAdminDialog}>
        <DialogTitle>Add New Admin</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddAdminSubmit} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={addAdminForm.name}
              onChange={handleAddAdminChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Email"
              name="email"
              value={addAdminForm.email}
              onChange={handleAddAdminChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={addAdminForm.password}
              onChange={handleAddAdminChange}
              fullWidth
              margin="normal"
              required
            />
            {addAdminError && <Alert severity="error" sx={{ mt: 2 }}>{addAdminError}</Alert>}
            {addAdminSuccess && <Alert severity="success" sx={{ mt: 2 }}>{addAdminSuccess}</Alert>}
            <DialogActions sx={{ mt: 1 }}>
              <Button onClick={handleCloseAddAdminDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="secondary" disabled={addAdminLoading}>
                {addAdminLoading ? 'Adding...' : 'Add Admin'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SuperAdminDashboard;