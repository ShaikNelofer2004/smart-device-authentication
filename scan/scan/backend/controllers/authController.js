const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const generateUniqueCode = require('../utils/generateUniqueCode');
const { sendOTPEmail } = require('../config/email');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { sendOTPSMS } = require('../utils/sendOTPSMS');
require('dotenv').config();

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate unique code
    let uniqueCode;
    let codeExists = true;
    
    // Keep generating until we find a unique one
    while (codeExists) {
      uniqueCode = generateUniqueCode();
      const existingUser = await User.findOne({ uniqueCode });
      if (!existingUser) {
        codeExists = false;
      }
    }

    // Generate QR code from unique code
    const qrCode = await QRCode.toDataURL(uniqueCode);

    // Create new user, allow role from request (default to 'user')
    user = new User({
      name,
      email,
      password,
      role: role || 'user',
      uniqueCode,
      qrCode
    });

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name, 
            email, 
            role: user.role, 
            uniqueCode,
            qrCode: user.qrCode 
          } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Update lastLogin and loginCount
    user.lastLogin = Date.now();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            uniqueCode: user.uniqueCode,
            qrCode: user.qrCode
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Request password reset (send OTP)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    await OTP.findOneAndDelete({ email }); // Delete any existing OTP
    
    const newOTP = new OTP({
      email,
      otp
    });
    
    await newOTP.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ msg: 'Failed to send OTP email' });
    }

    res.json({ msg: 'OTP sent to your email' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Verify OTP and reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete the used OTP
    await OTP.findOneAndDelete({ email, otp });

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update current user's profile (name, avatar)
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const { name, avatar } = req.body;
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json({ msg: 'Profile updated successfully', user: { name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Change current user's password
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current and new password are required' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Request OTP via phone for admin/superadmin
exports.requestOTPByPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ msg: 'Phone number is required' });

    // Find user by phone and check role
    const user = await User.findOne({ phone });
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(404).json({ msg: 'Admin or Superadmin with this phone not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any existing OTP for this phone
    await OTP.findOneAndDelete({ phone });

    // Save new OTP
    const newOTP = new OTP({ phone, otp });
    await newOTP.save();

    // Send OTP via SMS
    await sendOTPSMS(phone, otp);

    res.json({ msg: 'OTP sent to your phone' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Verify OTP and login via phone for admin/superadmin
exports.verifyOTPByPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ msg: 'Phone and OTP are required' });

    // Find OTP record
    const otpRecord = await OTP.findOne({ phone, otp });
    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(404).json({ msg: 'Admin or Superadmin with this phone not found' });
    }

    // Delete used OTP
    await OTP.findOneAndDelete({ phone, otp });

    // Update lastLogin and loginCount
    user.lastLogin = Date.now();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            uniqueCode: user.uniqueCode,
            qrCode: user.qrCode
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};