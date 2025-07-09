const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const generateUniqueCode = require('../utils/generateUniqueCode');
const QRCode = require('qrcode');
require('dotenv').config();

const createAdminUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Creating admin users...');
    
    // Admin user data
    const adminData = {
      name: 'Admin User',
      email: 'aakhilshaik204@gmail.com',
      password: 'admin123',
      role: 'admin',
      phone: '9440639183'
    };
    
    // Superadmin user data
    const superadminData = {
      name: 'Super Admin',
      email: 'neluashaik204@gmail.com',
      password: 'superadmin123',
      role: 'superadmin',
      phone: '9032665144'
    };
    
    // Check if admin already exists
    let adminExists = await User.findOne({ email: adminData.email });
    if (!adminExists) {
      // Generate unique code for admin
      let adminUniqueCode;
      let adminCodeExists = true;
      
      while (adminCodeExists) {
        adminUniqueCode = generateUniqueCode();
        const existingUser = await User.findOne({ uniqueCode: adminUniqueCode });
        if (!existingUser) {
          adminCodeExists = false;
        }
      }
      
      // Generate QR code for admin
      const adminQrCode = await QRCode.toDataURL(adminUniqueCode);
      
      // Create admin user
      const admin = new User({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        role: adminData.role,
        uniqueCode: adminUniqueCode,
        qrCode: adminQrCode,
        phone: adminData.phone
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Check if superadmin already exists
    let superadminExists = await User.findOne({ email: superadminData.email });
    if (!superadminExists) {
      // Generate unique code for superadmin
      let superadminUniqueCode;
      let superadminCodeExists = true;
      
      while (superadminCodeExists) {
        superadminUniqueCode = generateUniqueCode();
        const existingUser = await User.findOne({ uniqueCode: superadminUniqueCode });
        if (!existingUser) {
          superadminCodeExists = false;
        }
      }
      
      // Generate QR code for superadmin
      const superadminQrCode = await QRCode.toDataURL(superadminUniqueCode);
      
      // Create superadmin user
      const superadmin = new User({
        name: superadminData.name,
        email: superadminData.email,
        password: superadminData.password,
        role: superadminData.role,
        uniqueCode: superadminUniqueCode,
        qrCode: superadminQrCode,
        phone: superadminData.phone
      });
      
      await superadmin.save();
      console.log('Superadmin user created successfully');
    } else {
      console.log('Superadmin user already exists');
    }
    
    console.log('Admin users creation completed');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin users:', err);
    process.exit(1);
  }
};

createAdminUsers();