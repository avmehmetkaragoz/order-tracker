const crypto = require('crypto');

/**
 * Güvenli random string generator
 * AUTH_SECRET ve AUTH_PASSWORD için kullanılır
 */

function generateSecureRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateBase64Secret(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
}

console.log('🔐 GÜVENLİ AUTH SECRET GENERATOR');
console.log('================================\n');

// AUTH_SECRET için 32 byte (64 karakter hex) güvenli string
const authSecret = generateSecureRandomString(32);
console.log('AUTH_SECRET (Hex - 64 karakter):');
console.log(authSecret);
console.log('');

// AUTH_SECRET için base64url format (daha kısa)
const authSecretBase64 = generateBase64Secret(32);
console.log('AUTH_SECRET (Base64URL - 43 karakter):');
console.log(authSecretBase64);
console.log('');

// AUTH_PASSWORD için güvenli string
const authPassword = generateSecureRandomString(16);
console.log('AUTH_PASSWORD (Hex - 32 karakter):');
console.log(authPassword);
console.log('');

// Alternatif AUTH_PASSWORD (base64url)
const authPasswordBase64 = generateBase64Secret(16);
console.log('AUTH_PASSWORD (Base64URL - 22 karakter):');
console.log(authPasswordBase64);
console.log('');

console.log('📋 VERCEL ENVIRONMENT VARIABLES');
console.log('================================');
console.log('Vercel Dashboard\'da şu değişkenleri ekleyin:\n');

console.log('Variable Name: AUTH_SECRET');
console.log('Value: ' + authSecretBase64);
console.log('Environment: Production, Preview, Development\n');

console.log('Variable Name: AUTH_PASSWORD');
console.log('Value: ' + authPasswordBase64);
console.log('Environment: Production, Preview, Development\n');

console.log('🔧 .env.local DOSYASI İÇİN');
console.log('==========================');
console.log('Yerel geliştirme için .env.local dosyanıza ekleyin:\n');
console.log(`AUTH_SECRET="${authSecretBase64}"`);
console.log(`AUTH_PASSWORD="${authPasswordBase64}"`);
console.log('');

console.log('✅ GÜVENLİK NOTLARI');
console.log('==================');
console.log('• Bu değerler her çalıştırmada yeniden üretilir');
console.log('• Production\'da mutlaka farklı değerler kullanın');
console.log('• Bu değerleri asla git\'e commit etmeyin');
console.log('• .env.local dosyası .gitignore\'da olmalı');
console.log('• AUTH_SECRET JWT token imzalama için kullanılır');
console.log('• AUTH_PASSWORD login sistemi için kullanılır');