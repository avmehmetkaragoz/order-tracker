#!/usr/bin/env node

/**
 * Fix Admin User - Create correct bcrypt hash
 * 
 * Bu script admin kullanıcısı için doğru bcrypt hash oluşturur
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  try {
    console.log('🔐 Generating bcrypt hash for admin123...');
    
    const password = 'admin123';
    const saltRounds = 10;
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Generated hash:', hash);
    console.log('\n📋 SQL to update admin user:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('\n🧪 Hash validation test:', isValid ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateHash();