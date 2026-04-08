const http = require('http');

const data = JSON.stringify({
  articleId: '69bae54ff010d0b231887a26',
  fullName: 'Test Agent robust',
  phone: '12341234'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/annotations',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
