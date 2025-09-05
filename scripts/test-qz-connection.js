#!/usr/bin/env node

/**
 * QZ Tray Connection Test Script
 * Tests the connection to QZ Tray and lists available printers
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🖨️  QZ Tray Connection Test');
console.log('==========================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('📝 Please create .env.local with QZ_PRIVATE_KEY');
  console.log('💡 Copy from .env.example.qz and fill in your private key\n');
  process.exit(1);
}

// Check if QZ_PRIVATE_KEY is set
require('dotenv').config({ path: envPath });
if (!process.env.QZ_PRIVATE_KEY) {
  console.log('❌ QZ_PRIVATE_KEY not found in .env.local');
  console.log('📝 Please add your RSA private key to .env.local');
  console.log('💡 Generate with: openssl genrsa -out qz-private-key.pem 2048\n');
  process.exit(1);
}

console.log('✅ Environment configured');

// Test QZ signing endpoint
console.log('\n🔐 Testing QZ signing endpoint...');

const testData = 'test-challenge-' + Date.now();

const postData = JSON.stringify({ data: testData });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/qz-sign',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.signature) {
        console.log('✅ QZ signing endpoint working');
        console.log('📝 Signature length:', response.signature.length);

        console.log('\n🚀 Next steps:');
        console.log('1. Start QZ Tray application');
        console.log('2. Visit http://localhost:3000/printer-test');
        console.log('3. Click "QZ Test Yazdır" button');
        console.log('4. Accept security dialog if prompted');

        console.log('\n📋 Available test commands:');
        console.log('• npm run test:qz - Start dev server with QZ instructions');
        console.log('• npm run dev - Start development server');

      } else {
        console.log('❌ Signing failed:', response.error);
      }
    } catch (error) {
      console.log('❌ Invalid response from signing endpoint');
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Cannot connect to Next.js dev server');
  console.log('💡 Make sure to run: npm run dev');
  console.log('Error:', error.message);
});

req.write(postData);
req.end();

console.log('⏳ Testing connection to localhost:3000...');
