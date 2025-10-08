// Complete Authentication Flow Test
// Run this with: node test-auth-flow.js

const axios = require("axios");

const BACKEND_URL = "http://localhost:8000";
const FRONTEND_URL = "http://localhost:3000";

async function testCompleteAuthFlow() {
  console.log("🔐 Testing Complete Authentication Flow...\n");

  // Test 1: Signup Flow
  console.log("1️⃣ Testing Signup Flow...");
  const testUser = {
    email: `flowtest-${Date.now()}@example.com`,
    password: "FlowTest123!",
  };

  try {
    const signupResponse = await axios.post(
      `${BACKEND_URL}/auth/signup`,
      testUser
    );
    if (signupResponse.status === 200 && signupResponse.data.success) {
      console.log("✅ Signup successful");
      console.log(`   Email: ${testUser.email}`);
      console.log(`   User ID: ${signupResponse.data.data.user.id}`);
    }
  } catch (error) {
    console.log("❌ Signup failed:", error.response?.data || error.message);
    return;
  }

  // Test 2: Login Flow
  console.log("\n2️⃣ Testing Login Flow...");
  let accessToken = null;

  try {
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      accessToken = loginResponse.data.data.access_token;
      console.log("✅ Login successful");
      console.log(`   Access token received: ${accessToken ? "Yes" : "No"}`);
    }
  } catch (error) {
    console.log("❌ Login failed:", error.response?.data || error.message);
    return;
  }

  // Test 3: Get User Info
  console.log("\n3️⃣ Testing User Info Retrieval...");

  try {
    const userResponse = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (userResponse.status === 200 && userResponse.data.success) {
      console.log("✅ User info retrieved successfully");
      console.log(`   User email: ${userResponse.data.data.email}`);
      console.log(
        `   User metadata: ${JSON.stringify(
          userResponse.data.data.user_metadata
        )}`
      );
    }
  } catch (error) {
    console.log(
      "❌ User info retrieval failed:",
      error.response?.data || error.message
    );
  }

  // Test 4: Logout Flow
  console.log("\n4️⃣ Testing Logout Flow...");

  try {
    const logoutResponse = await axios.post(
      `${BACKEND_URL}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (logoutResponse.status === 200 && logoutResponse.data.success) {
      console.log("✅ Logout successful");
    }
  } catch (error) {
    console.log("❌ Logout failed:", error.response?.data || error.message);
  }

  // Test 5: Frontend Routes Accessibility
  console.log("\n5️⃣ Testing Frontend Routes...");

  const routes = [
    { path: "/login", name: "Login Page" },
    { path: "/signup", name: "Signup Page" },
    { path: "/forgot-password", name: "Forgot Password Page" },
  ];

  for (const route of routes) {
    try {
      const response = await axios.get(`${FRONTEND_URL}${route.path}`);
      if (response.status === 200) {
        console.log(`✅ ${route.name} accessible`);
      }
    } catch (error) {
      console.log(`❌ ${route.name} not accessible:`, error.message);
    }
  }

  // Test 6: Navigation Flow Simulation
  console.log("\n6️⃣ Testing Navigation Flow...");

  console.log("📋 User Journey Simulation:");
  console.log("   1. User visits /login");
  console.log('   2. User clicks "Create one here" → /signup');
  console.log(
    "   3. User fills signup form → redirects to /login with success message"
  );
  console.log("   4. User can now login with new credentials");
  console.log('   5. User can click "Forgot password?" → /forgot-password');
  console.log("   6. User can navigate back to login from any page");

  console.log("\n🎉 Complete Authentication Flow Test Completed!");

  console.log("\n📋 Manual Testing Checklist:");
  console.log("   □ Visit http://localhost:3000/login");
  console.log('   □ Click "Create one here" link');
  console.log("   □ Fill signup form and submit");
  console.log("   □ Verify redirect to login with success message");
  console.log("   □ Login with new credentials");
  console.log('   □ Test "Forgot password?" link');
  console.log("   □ Navigate between all auth pages");
  console.log("   □ Verify responsive design on mobile");
  console.log("   □ Test form validations");
  console.log("   □ Test error handling");

  console.log("\n🔗 Quick Links:");
  console.log("   Login: http://localhost:3000/login");
  console.log("   Signup: http://localhost:3000/signup");
  console.log("   Forgot Password: http://localhost:3000/forgot-password");
  console.log("   Dashboard: http://localhost:3000/dashboard");
}

// Run the test
testCompleteAuthFlow().catch(console.error);
