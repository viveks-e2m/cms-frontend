// Integration test for signup functionality
// Run this with: node test-signup-integration.js

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

async function testSignupIntegration() {
  console.log('🧪 Testing Signup Integration...\n');

  // Test 1: Backend API directly
  console.log('1️⃣ Testing Backend API directly...');
  try {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      user_metadata: {
        first_name: 'Integration',
        last_name: 'Test',
        full_name: 'Integration Test',
        role: 'employee'
      }
    };

    const response = await axios.post(`${BACKEND_URL}/auth/signup`, testUser, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Backend signup API working correctly');
      console.log(`   User created: ${testUser.email}`);
      console.log(`   User ID: ${response.data.data.user.id}`);
      console.log(`   User metadata: ${JSON.stringify(response.data.data.user.user_metadata)}`);
    } else {
      console.log('❌ Backend signup API failed');
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Backend signup API error');
    console.log('   Error:', error.response?.data || error.message);
  }

  // Test 2: Frontend accessibility
  console.log('\n2️⃣ Testing Frontend accessibility...');
  try {
    const frontendResponse = await axios.get(FRONTEND_URL);
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend is accessible');
    }
  } catch (error) {
    console.log('❌ Frontend not accessible');
    console.log('   Error:', error.message);
  }

  // Test 3: CORS configuration
  console.log('\n3️⃣ Testing CORS configuration...');
  try {
    const corsResponse = await axios.options(`${BACKEND_URL}/auth/signup`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (corsResponse.status === 200) {
      console.log('✅ CORS configuration working');
    }
  } catch (error) {
    console.log('❌ CORS configuration issue');
    console.log('   Error:', error.message);
  }

  // Test 4: Validation scenarios
  console.log('\n4️⃣ Testing validation scenarios...');
  
  // Test invalid email
  try {
    await axios.post(`${BACKEND_URL}/auth/signup`, {
      email: 'invalid-email',
      password: 'TestPassword123!',
      user_metadata: {}
    });
    console.log('❌ Email validation not working (should have failed)');
  } catch (error) {
    if (error.response?.status >= 400) {
      console.log('✅ Email validation working correctly');
    }
  }

  // Test weak password
  try {
    await axios.post(`${BACKEND_URL}/auth/signup`, {
      email: `test-weak-${Date.now()}@example.com`,
      password: '123',
      user_metadata: {}
    });
    console.log('❌ Password validation not working (should have failed)');
  } catch (error) {
    if (error.response?.status >= 400) {
      console.log('✅ Password validation working correctly');
    }
  }

  console.log('\n🎉 Integration test completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Open http://localhost:3000/signup in your browser');
  console.log('   2. Fill out the signup form');
  console.log('   3. Verify account creation works end-to-end');
  console.log('   4. Check that success message appears');
  console.log('   5. Verify redirect to login page works');
}

// Run the test
testSignupIntegration().catch(console.error);