import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  ButtonGroup,
  Tabs,
  Tab
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, Email, VpnKey } from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Grow from '@mui/material/Grow';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'phone'
  const [phoneData, setPhoneData] = useState({ phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpDebug, setOtpDebug] = useState('');

  const { login, error, clearError, user, setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === 'superadmin') {
        navigate('/superadmin');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }

    // Set error from context
    if (error) {
      setLocalError(error);
      clearError();
    }
  }, [user, error, clearError, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email') {
      // Simple email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(emailPattern.test(e.target.value) ? '' : 'Enter a valid email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    try {
      const res = await login(formData);
      
      // Redirect based on role
      if (res.user.role === 'superadmin') {
        navigate('/superadmin');
      } else if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setLocalError(err.response?.data?.msg || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick login for admin and superadmin
  const handleQuickLogin = async (role) => {
    setLocalError('');
    
    // Check if the entered credentials match the expected admin/superadmin credentials
    const adminCredentials = { email: 'aakhilshaik204@gmail.com', password: 'admin123' };
    const superadminCredentials = { email: 'neluashaik204@gmail.com', password: 'superadmin123' };
    
    const expectedCredentials = role === 'admin' ? adminCredentials : superadminCredentials;
    
    // Verify that the entered credentials match the expected ones
    if (formData.email !== expectedCredentials.email) {
      setLocalError(`Please enter the correct ${role} email address`);
      return;
    }
    
    if (formData.password !== expectedCredentials.password) {
      setLocalError(`Please enter the correct ${role} password`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await login(formData);
      
      if (res.user.role === 'superadmin') {
        navigate('/superadmin');
      } else if (res.user.role === 'admin') {
        navigate('/admin');
      }
    } catch (err) {
      setLocalError(err.response?.data?.msg || `${role.charAt(0).toUpperCase() + role.slice(1)} login failed`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e) => {
    setPhoneData({ ...phoneData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async () => {
    setLocalError('');
    setOtpSuccess('');
    setOtpLoading(true);
    try {
      // Only allow admin/superadmin numbers
      if (phoneData.phone !== '9440639183' && phoneData.phone !== '9032665144') {
        setLocalError('Only admin/superadmin phone numbers are allowed');
        setOtpLoading(false);
        return;
      }
      const res = await fetch('http://localhost:5000/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneData.phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to send OTP');
      setOtpSent(true);
      setOtpSuccess('OTP sent to your phone!');
    } catch (err) {
      setLocalError(err.message);
      setOtpSent(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setOtpSuccess('');
    setOtpDebug('');
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneData.phone, otp: phoneData.otp })
      });
      const data = await res.json();
      setOtpDebug(JSON.stringify(data, null, 2)); // Show full response for debugging
      if (!res.ok) throw new Error(data.msg || 'OTP login failed');
      // Save token and user (simulate AuthContext login)
      localStorage.setItem('token', data.token);
      if (setUser && setToken) {
        setUser(data.user);
        setToken(data.token);
      }
      if (data.user.role === 'superadmin') {
        navigate('/superadmin');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        setLocalError('Not an admin or superadmin account');
      }
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <LockOutlined color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" align="center" sx={{ letterSpacing: 1 }}>
              QR/Device Management System
            </Typography>
          </Box>
          <Typography component="h1" variant="h6" align="center" gutterBottom>
            Sign In
          </Typography>
          <Grow in={!!localError || !!otpSuccess}>
            <div>
              {localError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {localError}
                </Alert>
              )}
              {otpSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {otpSuccess}
                </Alert>
              )}
            </div>
          </Grow>
          {otpDebug && (
            <Alert severity="info" sx={{ mb: 2, whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
              <strong>OTP Debug Response:</strong>
              <br />
              {otpDebug}
            </Alert>
          )}
          <Tabs
            value={loginMode}
            onChange={(_, v) => { setLoginMode(v); setLocalError(''); }}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab icon={<Email />} label="Email/Password" value="email" />
            <Tab icon={<PhoneIphoneIcon />} label="Phone/OTP (Admin/Superadmin)" value="phone" />
          </Tabs>
          {loginMode === 'email' ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                error={!!emailError}
                helperText={emailError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
                disabled={isSubmitting || !!emailError}
              >
                {isSubmitting ? <CircularProgress size={20} /> : 'Sign In'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handlePhoneLogin} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="phone"
                label="Phone Number"
                name="phone"
                autoComplete="tel"
                value={phoneData.phone}
                onChange={handlePhoneChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIphoneIcon />
                    </InputAdornment>
                  )
                }}
              />
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 1, mb: 2 }}
                onClick={handleSendOTP}
                disabled={otpLoading || !phoneData.phone}
              >
                {otpLoading ? <CircularProgress size={20} /> : (otpSent ? 'Resend OTP' : 'Send OTP')}
              </Button>
              <TextField
                margin="normal"
                required
                fullWidth
                id="otp"
                label="OTP"
                name="otp"
                value={phoneData.otp}
                onChange={handlePhoneChange}
                disabled={!otpSent}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
                disabled={isSubmitting || !otpSent || !phoneData.otp}
              >
                {isSubmitting ? <CircularProgress size={20} /> : 'Login with OTP'}
              </Button>
            </Box>
          )}
          <Divider sx={{ my: 2 }}>Quick Access</Divider>
          
          <ButtonGroup variant="outlined" size="small" fullWidth sx={{ mb: 2 }}>
            <Button 
              onClick={() => handleQuickLogin('admin')}
              disabled={isSubmitting}
              sx={{ textTransform: 'none' }}
            >
              Admin Login
            </Button>
            <Button 
              onClick={() => handleQuickLogin('superadmin')}
              disabled={isSubmitting}
              sx={{ textTransform: 'none' }}
            >
              Superadmin Login
            </Button>
          </ButtonGroup>
          
          <Grid container>
            <Grid item xs>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Forgot password?
                </Typography>
              </Link>
            </Grid>
            <Grid item>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Don't have an account? Sign Up
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;