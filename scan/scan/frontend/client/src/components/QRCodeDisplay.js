import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Typography, Paper } from '@mui/material';

const QRCodeDisplay = ({ uniqueCode, size = 200 }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 300, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>Your Unique QR Code</Typography>
      <Box sx={{ mb: 2 }}>
        <QRCodeSVG value={uniqueCode} size={size} />
      </Box>
      <Typography variant="body1" align="center" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
        {uniqueCode}
      </Typography>
    </Paper>
  );
};

export default QRCodeDisplay;