#!/usr/bin/env ts-node

/**
 * Test script for OTP Registration Flow
 * Usage: npx ts-node scripts/test-otp-flow.ts
 */

import axios from 'axios';
import readline from 'readline';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const TEST_EMAIL = 'test-otp@example.com';
const TEST_PASSWORD = 'password123';
const TEST_ROLE = 'MENTEE';

async function testOtpFlow() {
  console.log('🧪 Testing OTP Registration Flow\n');

  try {
    // Step 1: Request OTP Code
    console.log('📧 Step 1: Requesting OTP code...');
    const requestResponse = await axios.post(`${API_BASE}/auth/register/request-code`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: TEST_ROLE,
    });

    console.log('✅ OTP code requested successfully');
    console.log('Response:', JSON.stringify(requestResponse.data, null, 2));

    // In development, you should see the OTP code in server logs
    console.log('\n🔍 Check server console for the OTP code (development mode)');
    console.log('Format: 🔐 Verification code for test-otp@example.com: XXXXXX\n');

    const otpCode = await promptForInput('Enter the OTP code from server logs: ');

    // Step 2: Verify OTP Code
    console.log('✨ Step 2: Verifying OTP code...');
    const verifyResponse = await axios.post(`${API_BASE}/auth/register/verify`, {
      email: TEST_EMAIL,
      code: otpCode,
    });

    console.log('🎉 User registered successfully!');
    console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));

    // Step 3: Test the token by calling /auth/me
    const token = verifyResponse.data.data.token;
    console.log('\n🔐 Step 3: Testing JWT token...');
    
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Token is valid!');
    console.log('User profile:', JSON.stringify(meResponse.data, null, 2));

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

function promptForInput(question: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Run the test
if (require.main === module) {
  testOtpFlow().catch(console.error);
}