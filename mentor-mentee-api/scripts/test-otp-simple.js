#!/usr/bin/env node

/**
 * Simple OTP Testing Script
 * Usage: node scripts/test-otp-simple.js
 */

const https = require('http');

const API_BASE = 'http://localhost:3000/api';
const TEST_EMAIL = 'test-otp@example.com';

async function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testOtpFlow() {
  console.log('🧪 Testing OTP Registration Flow\n');

  try {
    // Step 1: Request OTP Code
    console.log('📧 Step 1: Requesting OTP code...');
    const requestResult = await makeRequest('POST', '/auth/register/request-code', {
      email: TEST_EMAIL,
      password: 'password123',
      role: 'MENTEE',
    });

    console.log('Status:', requestResult.status);
    console.log('Response:', JSON.stringify(requestResult.data, null, 2));

    if (requestResult.status !== 201) {
      console.error('❌ Failed to request OTP code');
      return;
    }

    console.log('✅ OTP code requested successfully');
    console.log('\n🔍 Check server console for the OTP code');
    console.log('Look for: 📧 EMAIL VERIFICATION CODE (DEVELOPMENT MODE)\n');

    console.log('📝 Next steps:');
    console.log('1. Copy the 6-digit code from server console');
    console.log('2. Use POST /auth/register/verify with:');
    console.log('   {');
    console.log(`     "email": "${TEST_EMAIL}",`);
    console.log('     "code": "XXXXXX"');
    console.log('   }');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOtpFlow().catch(console.error);