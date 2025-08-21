#!/usr/bin/env node

/**
 * Test Login API
 * 
 * Bu script login API'sini test eder
 */

async function testLoginAPI() {
  try {
    console.log('🧪 Testing login API...');
    
    const response = await fetch('http://localhost:3000/api/auth/user-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response data:', data);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLoginAPI();