import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Grid, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import AdbIcon from '@mui/icons-material/Adb';
import '../App.css';

const features = [
  'Real-time location tracking for all users and devices',
  'Secure QR code generation and management',
  'Admin and SuperAdmin dashboards for full control',
  'Easy user registration and device onboarding',
];

const steps = [
  'Register an account',
  'Add your devices',
  'Track locations and manage users from your dashboard',
];

const gradient = 'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)';

const Home = () => {
  // Helper to split headline into animated spans
  const headline = 'Smart Device & Location Management Made Easy';
  const animatedHeadline = headline.split('').map((char, i) => (
    <span
      key={i}
      className="animated-headline-span"
      style={{
        animationDelay: `${0.05 * i + 0.2}s`,
        animationName: 'letterPop',
        animationDuration: '0.7s',
        animationFillMode: 'both',
        display: 'inline-block',
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  return (
    <Box sx={{ fontFamily: 'Roboto, sans-serif', minHeight: '100vh', bgcolor: '#f7f9fb' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'primary.main', boxShadow: 'none', borderBottom: '1px solid #e3e6ee' }}>
        <Toolbar>
          <AdbIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1, color: 'primary.main' }}>
            SmartTrack
          </Typography>
          <Button color="primary" component={Link} to="/login" sx={{ mr: 2, fontWeight: 600 }}>
            Login
          </Button>
          <Button color="primary" variant="contained" component={Link} to="/register" sx={{ fontWeight: 600, boxShadow: 2 }}>
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{
        background: gradient,
        py: { xs: 8, md: 12 },
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            gutterBottom
            className="animated-headline"
            sx={{ fontWeight: 900, letterSpacing: 1, mb: 2, fontSize: { xs: '2.2rem', md: '3.5rem' } }}
          >
            {animatedHeadline}
          </Typography>
          <Typography variant="h5" color="rgba(255,255,255,0.92)" paragraph sx={{ mb: 4, fontWeight: 400 }}>
            Track, manage, and secure your devices with real-time location updates and QR code technology.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            component={Link}
            to="/register"
            className="animated-btn"
            sx={{
              mt: 2,
              px: 5,
              py: 1.5,
              fontSize: '1.2rem',
              fontWeight: 700,
              borderRadius: 8,
              boxShadow: 4,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.07)',
                boxShadow: 8,
                background: 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)',
                color: 'white',
              },
            }}
          >
            Get Started
          </Button>
        </Container>
        {/* Wavy SVG Divider */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: -1, width: '100%', lineHeight: 0 }}>
          <svg viewBox="0 0 1440 100" width="100%" height="100" xmlns="http://www.w3.org/2000/svg"><path fill="#f7f9fb" d="M0,64L48,58.7C96,53,192,43,288,53.3C384,64,480,96,576,101.3C672,107,768,85,864,74.7C960,64,1056,64,1152,80C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </Box>
      </Box>

      {/* About/Description */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          About This Platform
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.15rem', lineHeight: 1.7 }}>
          Our platform provides a seamless solution for tracking and managing devices and users in real time. Designed for organizations and individuals who need to monitor assets, ensure security, and streamline device management, our system leverages QR code technology and robust dashboards for admins and superadmins.
        </Typography>
      </Container>

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
          How It Works
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {steps.map((step, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper elevation={4} sx={{ p: 4, borderRadius: 5, textAlign: 'center', boxShadow: '0 8px 32px rgba(106,130,251,0.08)', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'scale(1.04)', boxShadow: '0 16px 48px rgba(106,130,251,0.16)' } }}>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Step {idx + 1}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, fontSize: '1.1rem' }}>
                  {step}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
          Features
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 5, textAlign: 'center', boxShadow: '0 8px 32px rgba(252,92,125,0.08)' }}>
                <CheckCircleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {feature}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#22223b', py: 4, mt: 8, color: 'white' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Divider sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.12)' }} />
          <Box sx={{ mb: 2 }}>
            <IconButton href="#" sx={{ color: 'white', mx: 1 }}><FacebookIcon /></IconButton>
            <IconButton href="#" sx={{ color: 'white', mx: 1 }}><TwitterIcon /></IconButton>
            <IconButton href="#" sx={{ color: 'white', mx: 1 }}><LinkedInIcon /></IconButton>
            <IconButton href="#" sx={{ color: 'white', mx: 1 }}><InstagramIcon /></IconButton>
          </Box>
          <Typography variant="body2" color="rgba(255,255,255,0.7)">
            &copy; {new Date().getFullYear()} SmartTrack. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 