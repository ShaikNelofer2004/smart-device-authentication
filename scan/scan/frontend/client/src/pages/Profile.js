import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Profile.css'; // (optional) for styling
import { Box, Typography, Button, TextField, Alert, Paper, Avatar } from '@mui/material';
import axios from 'axios';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [editProfile, setEditProfile] = useState({ name: '', email: '', avatar: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      setEditProfile({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setEditProfile((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    try {
      const res = await axios.put('http://localhost:5000/api/auth/me', {
        name: editProfile.name,
        avatar: editProfile.avatar,
      });
      setSuccess(res.data.msg || 'Profile updated successfully!');
      setUser && setUser((prev) => ({ ...prev, name: editProfile.name, avatar: editProfile.avatar }));
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile.');
      setLoading(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwSuccess('');
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(res.data.msg || 'Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPwLoading(false);
    } catch (err) {
      setPwError(err.response?.data?.msg || 'Failed to change password.');
      setPwLoading(false);
    }
  };

  return (
    <Box className="profile-container" sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>My Profile</Typography>
        <Box className="profile-avatar-section" sx={{ textAlign: 'center', mb: 2 }}>
          <Avatar
            src={avatarPreview || 'https://via.placeholder.com/100'}
            alt="Avatar"
            sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
          />
          <Button
            variant="outlined"
            component="label"
            sx={{ mt: 1 }}
          >
            Change Avatar
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </Button>
        </Box>
        <form className="profile-form" onSubmit={handleSubmit}>
          <TextField
            label="Name"
            name="name"
            value={editProfile.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            value={editProfile.email}
            fullWidth
            margin="normal"
            disabled
          />
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2 }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box className="profile-password-section" sx={{ mt: 4 }}>
          <Typography variant="h6">Change Password</Typography>
          <form onSubmit={handlePwSubmit} style={{ marginTop: 8 }}>
            <TextField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="New Password"
              name="newPassword"
              type="password"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Confirm New Password"
              name="confirmNewPassword"
              type="password"
              value={pwForm.confirmNewPassword}
              onChange={handlePwChange}
              fullWidth
              margin="normal"
              required
            />
            <Button type="submit" variant="contained" color="secondary" fullWidth disabled={pwLoading} sx={{ mt: 2 }}>
              {pwLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
          {pwSuccess && <Alert severity="success" sx={{ mt: 2 }}>{pwSuccess}</Alert>}
          {pwError && <Alert severity="error" sx={{ mt: 2 }}>{pwError}</Alert>}
        </Box>
      </Paper>
    </Box>
  );
};

export default Profile; 