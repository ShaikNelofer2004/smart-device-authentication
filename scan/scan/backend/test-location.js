const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testLocation = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  speed: 5.5,
  heading: 90
};

let authToken = null;
let userId = null;

async function testLocationTracking() {
  console.log('🧪 Testing Location Tracking API...\n');

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

    // 3. Update user location
    console.log('\n3. Updating user location...');
    const updateResponse = await axios.put(`${API_BASE_URL}/locations/${userId}`, testLocation, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✅ Location updated successfully');
    console.log('   Response:', updateResponse.data);

    // 4. Get all user locations
    console.log('\n4. Getting all user locations...');
    const locationsResponse = await axios.get(`${API_BASE_URL}/locations/users`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✅ User locations retrieved successfully');
    console.log('   Users with locations:', locationsResponse.data.length);

    // 5. Get user location history
    console.log('\n5. Getting user location history...');
    const historyResponse = await axios.get(`${API_BASE_URL}/locations/history/${userId}`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✅ Location history retrieved successfully');
    console.log('   History entries:', historyResponse.data.length);

    // 6. Mark user as offline
    console.log('\n6. Marking user as offline...');
    const offlineResponse = await axios.put(`${API_BASE_URL}/locations/${userId}/offline`, {}, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✅ User marked as offline successfully');

    console.log('\n🎉 All location tracking tests passed!');
    console.log('\n📋 Summary:');
    console.log('   - User registration: ✅');
    console.log('   - User login: ✅');
    console.log('   - Location update: ✅');
    console.log('   - Get all locations: ✅');
    console.log('   - Get location history: ✅');
    console.log('   - Mark user offline: ✅');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Run the test
testLocationTracking(); 