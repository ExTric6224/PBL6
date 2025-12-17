import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...\n');

    // 1. Login as admin
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: '123456'
    });

    const { token, user } = loginResponse.data.data;
    
    console.log('✅ Login successful!');
    console.log('User:', user.email, '| Role:', user.role);
    console.log('Token:', token.substring(0, 50) + '...\n');

    // 2. Test /admin/statistics with token
    console.log('📊 Testing /admin/statistics...');
    try {
      const statsResponse = await axios.get(`${API_URL}/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Statistics loaded successfully!');
      console.log('Stats:', statsResponse.data.data);
    } catch (error: any) {
      console.error('❌ Failed to load statistics');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data);
    }

    console.log('\n👥 Testing /admin/users...');
    try {
      const usersResponse = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Users loaded successfully!');
      console.log('Total users:', usersResponse.data.data.length);
    } catch (error: any) {
      console.error('❌ Failed to load users');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data);
    }

  } catch (error: any) {
    console.error('❌ Login failed');
    console.error('Error:', error.response?.data || error.message);
  }
}

testAdminLogin();
