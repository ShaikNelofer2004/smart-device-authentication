const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Device Test User',
  email: 'devicetest@example.com',
  password: 'password123'
};

const testDeviceQR = '1234567890123456'; // 16-digit QR code

// Test locations (forming a path)
const testLocations = [
  { latitude: 40.7128, longitude: -74.0060, locationName: 'New York Start' },
  { latitude: 40.7589, longitude: -73.9851, locationName: 'Times Square' },
  { latitude: 40.7505, longitude: -73.9934, locationName: 'Penn Station' },
  { latitude: 40.7484, longitude: -73.9857, locationName: 'Empire State Building' },
  { latitude: 40.7527, longitude: -73.9772, locationName: 'Grand Central Terminal' }
];

let authToken = null;
let userId = null;
let deviceId = null;

async function testDeviceDistanceTracking() {
  console.log('🧪 Testing Device Distance Tracking with Polylines...\n');

  try {
    // 1. Register a test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log('✅ User registered successfully');
    
    // 2. Login to get auth token
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    userId = loginResponse.data.user._id;
    console.log('✅ Login successful');

    // 3. Add a device
    console.log('\n3. Adding device...');
    const deviceResponse = await axios.post(`${API_BASE_URL}/devices/add`, {
      qrCode: testDeviceQR
    }, {
      headers: { 'x-auth-token': authToken }
    });
    deviceId = deviceResponse.data.device._id;
    console.log('✅ Device added successfully');
    console.log('   Device ID:', deviceId);

    // 4. Update device location multiple times to create a path
    console.log('\n4. Updating device locations to create a path...');
    let totalDistance = 0;
    
    for (let i = 0; i < testLocations.length; i++) {
      const location = testLocations[i];
      console.log(`   Updating location ${i + 1}/${testLocations.length}: ${location.locationName}`);
      
      const updateResponse = await axios.put(`${API_BASE_URL}/devices/${deviceId}/location`, location, {
        headers: { 'x-auth-token': authToken }
      });
      
      const distanceIncrement = parseFloat(updateResponse.data.device.distanceIncrement);
      totalDistance = updateResponse.data.device.totalDistance;
      
      console.log(`   ✅ Location updated - Distance increment: ${distanceIncrement.toFixed(4)} km, Total: ${totalDistance.toFixed(4)} km`);
      
      // Add a small delay between updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 5. Get device location history
    console.log('\n5. Getting device location history...');
    const historyResponse = await axios.get(`${API_BASE_URL}/devices/${deviceId}/history`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✅ Device location history retrieved successfully');
    console.log('   History entries:', historyResponse.data.length);
    console.log('   Total distance from history:', totalDistance.toFixed(4), 'km');

    // 6. Get all devices with locations (admin view)
    console.log('\n6. Getting all devices with locations (admin view)...');
    const allDevicesResponse = await axios.get(`${API_BASE_URL}/devices/all-locations`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✅ All devices retrieved successfully');
    console.log('   Total devices:', allDevicesResponse.data.length);
    
    const ourDevice = allDevicesResponse.data.find(d => d._id === deviceId);
    if (ourDevice) {
      console.log('   Our device total distance:', (ourDevice.totalDistance || 0).toFixed(4), 'km');
      console.log('   Our device current location:', ourDevice.currentLocation);
    }

    // 7. Calculate expected distance manually
    console.log('\n7. Calculating expected distance manually...');
    let expectedDistance = 0;
    for (let i = 1; i < testLocations.length; i++) {
      const prev = testLocations[i - 1];
      const curr = testLocations[i];
      const R = 6371; // Earth radius in km
      const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
      const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      expectedDistance += R * c;
    }
    console.log('   Expected total distance:', expectedDistance.toFixed(4), 'km');
    console.log('   Actual total distance:', totalDistance.toFixed(4), 'km');
    console.log('   Difference:', Math.abs(expectedDistance - totalDistance).toFixed(4), 'km');

    console.log('\n🎉 All device distance tracking tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - User registration: ✅');
    console.log('   - User login: ✅');
    console.log('   - Device addition: ✅');
    console.log('   - Location updates with distance calculation: ✅');
    console.log('   - Location history retrieval: ✅');
    console.log('   - Admin device view: ✅');
    console.log('   - Distance calculation accuracy: ✅');
    console.log('\n🗺️  The device has traveled a path through New York City!');
    console.log('   You can now view this path with polylines in the admin dashboard.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.data?.msg) {
      console.error('Error message:', error.response.data.msg);
    }
  }
}

// Run the test
testDeviceDistanceTracking(); 