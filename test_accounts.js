// Test script to check if /accounts endpoint is working
const axios = require('axios');

async function testAccounts() {
  try {
    const response = await axios.get('http://localhost:5000/accounts');
    console.log('✅ Accounts endpoint response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error testing accounts endpoint:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data || error.message);
  }
}

testAccounts();