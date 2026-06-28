const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:8080/api/annotations', {
      articleId: '69bae54ff010d0b231887a26',
      fullName: 'Test Agent',
      phone: '99999999'
    });
    console.log('✅ Response:', res.data);
  } catch (err) {
    console.error('❌ Error Status:', err.response?.status);
    console.error('❌ Error Data:', err.response?.data);
  }
}

test();
