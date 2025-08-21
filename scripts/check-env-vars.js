#!/usr/bin/env node

/**
 * Production Environment Variables Debug Script
 * Bu script Vercel'de hangi environment variable'ların mevcut olduğunu kontrol eder
 */

console.log('🔍 Environment Variables Debug Report')
console.log('=====================================')
console.log()

console.log('📊 Node.js Environment:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('VERCEL:', process.env.VERCEL)
console.log('VERCEL_ENV:', process.env.VERCEL_ENV)
console.log()

console.log('🔐 Authentication Variables:')
console.log('ADMIN_PASSWORD exists:', !!process.env.ADMIN_PASSWORD)
console.log('ADMIN_PASSWORD value:', process.env.ADMIN_PASSWORD ? `"${process.env.ADMIN_PASSWORD}"` : 'undefined')
console.log('ADMIN_PASSWORD length:', process.env.ADMIN_PASSWORD?.length || 0)
console.log()

console.log('AUTH_PASSWORD exists:', !!process.env.AUTH_PASSWORD)
console.log('AUTH_PASSWORD value:', process.env.AUTH_PASSWORD ? `"${process.env.AUTH_PASSWORD}"` : 'undefined')
console.log('AUTH_PASSWORD length:', process.env.AUTH_PASSWORD?.length || 0)
console.log()

console.log('AUTH_SECRET exists:', !!process.env.AUTH_SECRET)
console.log('AUTH_SECRET value:', process.env.AUTH_SECRET ? `"${process.env.AUTH_SECRET}"` : 'undefined')
console.log('AUTH_SECRET length:', process.env.AUTH_SECRET?.length || 0)
console.log()

console.log('🔍 String Analysis:')
if (process.env.ADMIN_PASSWORD) {
  const adminPass = process.env.ADMIN_PASSWORD
  console.log('ADMIN_PASSWORD characters:', adminPass.split('').map(c => `'${c}'`).join(', '))
  console.log('ADMIN_PASSWORD has leading/trailing spaces:', adminPass !== adminPass.trim())
  console.log('ADMIN_PASSWORD trimmed:', `"${adminPass.trim()}"`)
}

if (process.env.AUTH_PASSWORD) {
  const authPass = process.env.AUTH_PASSWORD
  console.log('AUTH_PASSWORD characters:', authPass.split('').map(c => `'${c}'`).join(', '))
  console.log('AUTH_PASSWORD has leading/trailing spaces:', authPass !== authPass.trim())
  console.log('AUTH_PASSWORD trimmed:', `"${authPass.trim()}"`)
}

console.log()
console.log('🎯 Expected Password: "deka_2025"')
console.log('Expected length:', 'deka_2025'.length)
console.log('Expected characters:', 'deka_2025'.split('').map(c => `'${c}'`).join(', '))
console.log()

console.log('✅ Comparison Tests:')
const expectedPassword = 'deka_2025'
if (process.env.ADMIN_PASSWORD) {
  console.log('ADMIN_PASSWORD === "deka_2025":', process.env.ADMIN_PASSWORD === expectedPassword)
  console.log('ADMIN_PASSWORD.trim() === "deka_2025":', process.env.ADMIN_PASSWORD.trim() === expectedPassword)
}
if (process.env.AUTH_PASSWORD) {
  console.log('AUTH_PASSWORD === "deka_2025":', process.env.AUTH_PASSWORD === expectedPassword)
  console.log('AUTH_PASSWORD.trim() === "deka_2025":', process.env.AUTH_PASSWORD.trim() === expectedPassword)
}

console.log()
console.log('📋 All Environment Variables (filtered):')
Object.keys(process.env)
  .filter(key => key.includes('AUTH') || key.includes('ADMIN') || key.includes('PASSWORD'))
  .sort()
  .forEach(key => {
    console.log(`${key}:`, process.env[key] ? `"${process.env[key]}"` : 'undefined')
  })