#!/usr/bin/env node

/**
 * HTTPS Development Server Setup Script
 * 
 * This script helps set up HTTPS for local development to enable camera access
 * for barcode scanning functionality on mobile devices.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔒 HTTPS Development Setup for Barcode Scanner')
console.log('===============================================\n')

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.')
  process.exit(1)
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

console.log('📋 Current project:', packageJson.name)
console.log('📋 Current dev script:', packageJson.scripts?.dev || 'Not found')

// Check if Next.js is installed
if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
  console.error('❌ Error: Next.js not found in dependencies.')
  process.exit(1)
}

console.log('\n🔍 Checking system requirements...')

// Check if mkcert is installed
let hasMkcert = false
try {
  execSync('mkcert -version', { stdio: 'ignore' })
  hasMkcert = true
  console.log('✅ mkcert is installed')
} catch (error) {
  console.log('❌ mkcert is not installed')
}

// Check if openssl is available
let hasOpenssl = false
try {
  execSync('openssl version', { stdio: 'ignore' })
  hasOpenssl = true
  console.log('✅ OpenSSL is available')
} catch (error) {
  console.log('❌ OpenSSL is not available')
}

console.log('\n📝 HTTPS Setup Options:')
console.log('=======================')

if (hasMkcert) {
  console.log('\n🎯 Option 1: Using mkcert (Recommended)')
  console.log('---------------------------------------')
  console.log('mkcert creates locally-trusted development certificates.')
  console.log('\nSteps to set up:')
  console.log('1. Create certificates:')
  console.log('   mkcert localhost 127.0.0.1 ::1')
  console.log('\n2. Update your package.json dev script:')
  console.log('   "dev": "next dev --experimental-https --experimental-https-key ./localhost-key.pem --experimental-https-cert ./localhost.pem"')
  console.log('\n3. Start development server:')
  console.log('   npm run dev')
  console.log('\n4. Access your app at: https://localhost:3000')
} else {
  console.log('\n📦 mkcert Installation:')
  console.log('----------------------')
  console.log('To install mkcert:')
  console.log('\nWindows (using Chocolatey):')
  console.log('  choco install mkcert')
  console.log('\nWindows (using Scoop):')
  console.log('  scoop bucket add extras')
  console.log('  scoop install mkcert')
  console.log('\nmacOS (using Homebrew):')
  console.log('  brew install mkcert')
  console.log('\nLinux (Ubuntu/Debian):')
  console.log('  sudo apt install libnss3-tools')
  console.log('  curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"')
  console.log('  chmod +x mkcert-v*-linux-amd64')
  console.log('  sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert')
}

if (hasOpenssl) {
  console.log('\n🔧 Option 2: Using OpenSSL (Alternative)')
  console.log('----------------------------------------')
  console.log('Create self-signed certificates (browser will show security warning):')
  console.log('\n1. Generate private key:')
  console.log('   openssl genrsa -out localhost-key.pem 2048')
  console.log('\n2. Generate certificate:')
  console.log('   openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -subj "/CN=localhost"')
  console.log('\n3. Update package.json dev script (same as Option 1)')
}

console.log('\n🚀 Option 3: Next.js Built-in HTTPS (Simplest)')
console.log('-----------------------------------------------')
console.log('Next.js can generate self-signed certificates automatically:')
console.log('\n1. Update your package.json dev script:')
console.log('   "dev": "next dev --experimental-https"')
console.log('\n2. Start development server:')
console.log('   npm run dev')
console.log('\n3. Accept the browser security warning')
console.log('4. Access your app at: https://localhost:3000')

console.log('\n📱 Mobile Testing:')
console.log('==================')
console.log('To test on mobile devices:')
console.log('\n1. Find your computer\'s IP address:')
console.log('   Windows: ipconfig')
console.log('   macOS/Linux: ifconfig or ip addr')
console.log('\n2. Access from mobile: https://YOUR_IP:3000')
console.log('3. Accept security certificate on mobile device')

console.log('\n⚠️  Important Notes:')
console.log('===================')
console.log('• HTTPS is required for camera access on mobile devices')
console.log('• Self-signed certificates will show security warnings')
console.log('• mkcert certificates are trusted locally without warnings')
console.log('• For production, use proper SSL certificates')

console.log('\n🔧 Automatic Setup:')
console.log('===================')

const setupChoice = process.argv[2]

if (setupChoice === 'auto' || setupChoice === 'mkcert') {
  if (hasMkcert) {
    console.log('\n🚀 Setting up mkcert certificates...')
    
    try {
      // Install local CA
      console.log('📋 Installing local CA...')
      execSync('mkcert -install', { stdio: 'inherit' })
      
      // Generate certificates
      console.log('📋 Generating certificates...')
      execSync('mkcert localhost 127.0.0.1 ::1', { stdio: 'inherit' })
      
      // Update package.json
      console.log('📋 Updating package.json...')
      packageJson.scripts.dev = 'next dev --experimental-https --experimental-https-key ./localhost-key.pem --experimental-https-cert ./localhost.pem'
      packageJson.scripts['dev:https'] = packageJson.scripts.dev
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      
      console.log('\n✅ HTTPS setup complete!')
      console.log('🚀 Run "npm run dev" to start the HTTPS development server')
      console.log('🌐 Access your app at: https://localhost:3000')
      
    } catch (error) {
      console.error('\n❌ Error during setup:', error.message)
      console.log('\n💡 Try manual setup or use Option 3 (built-in HTTPS)')
    }
  } else {
    console.log('\n❌ mkcert not found. Please install mkcert first or use Option 3.')
  }
} else if (setupChoice === 'builtin') {
  console.log('\n🚀 Setting up built-in HTTPS...')
  
  // Update package.json for built-in HTTPS
  packageJson.scripts.dev = 'next dev --experimental-https'
  packageJson.scripts['dev:https'] = packageJson.scripts.dev
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  
  console.log('\n✅ Built-in HTTPS setup complete!')
  console.log('🚀 Run "npm run dev" to start the HTTPS development server')
  console.log('🌐 Access your app at: https://localhost:3000')
  console.log('⚠️  You will need to accept the security warning in your browser')
} else {
  console.log('\n💡 Usage:')
  console.log('  node scripts/setup-https-dev.js auto     # Auto setup with mkcert')
  console.log('  node scripts/setup-https-dev.js mkcert   # Setup with mkcert')
  console.log('  node scripts/setup-https-dev.js builtin  # Setup with built-in HTTPS')
  console.log('  node scripts/setup-https-dev.js          # Show options only')
}

console.log('\n🎉 Happy coding with HTTPS! 🔒')