#!/usr/bin/env node

/**
 * Test Barcode Data Setup Script
 * 
 * This script adds test barcode data to the warehouse_items table
 * for testing the barcode scanning functionality.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('📦 Test Barcode Data Setup')
console.log('==========================\n')

// Load environment variables manually
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return envVars
  } catch (error) {
    console.error('❌ Error reading .env.local file:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables not found')
  console.log('Please check .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test barcode data
const testBarcodes = [
  {
    barcode: 'WH967843EU2ZMM',
    material: 'OPP',
    cm: 70,
    mikron: 25,
    supplier: 'Test Tedarikçi A',
    current_weight: 150.5,
    original_weight: 200.0,
    coil_count: 3,
    original_coil_count: 4,
    location: 'Depo A-1',
    status: 'Stokta',
    stock_type: 'general',
    notes: 'Test barkod verisi 1'
  },
  {
    barcode: 'WH472121M6ZPXK',
    material: 'PE',
    cm: 50,
    mikron: 30,
    supplier: 'Test Tedarikçi B',
    current_weight: 85.2,
    original_weight: 120.0,
    coil_count: 2,
    original_coil_count: 3,
    location: 'Depo B-2',
    status: 'Stokta',
    stock_type: 'customer',
    customer_name: 'Test Müşteri',
    notes: 'Test barkod verisi 2'
  },
  {
    barcode: 'WH123456ABCDEF',
    material: 'PP',
    cm: 60,
    mikron: 20,
    supplier: 'Test Tedarikçi C',
    current_weight: 95.8,
    original_weight: 100.0,
    coil_count: 1,
    original_coil_count: 1,
    location: 'Depo C-3',
    status: 'Stokta',
    stock_type: 'general',
    notes: 'Test barkod verisi 3'
  }
]

async function addTestBarcodes() {
  try {
    console.log('🔍 Checking existing test barcodes...')
    
    // Check if test barcodes already exist
    const { data: existingItems, error: checkError } = await supabase
      .from('warehouse_items')
      .select('barcode')
      .in('barcode', testBarcodes.map(item => item.barcode))
    
    if (checkError) {
      console.error('❌ Error checking existing barcodes:', checkError)
      return
    }
    
    const existingBarcodes = existingItems?.map(item => item.barcode) || []
    const newBarcodes = testBarcodes.filter(item => !existingBarcodes.includes(item.barcode))
    
    if (newBarcodes.length === 0) {
      console.log('✅ All test barcodes already exist in database')
      console.log('📋 Existing test barcodes:')
      testBarcodes.forEach(item => {
        console.log(`   • ${item.barcode} - ${item.material} (${item.cm}cm, ${item.mikron}μ)`)
      })
      return
    }
    
    console.log(`📦 Adding ${newBarcodes.length} new test barcodes...`)
    
    // Add new test barcodes
    const { data, error } = await supabase
      .from('warehouse_items')
      .insert(newBarcodes)
      .select()
    
    if (error) {
      console.error('❌ Error adding test barcodes:', error)
      return
    }
    
    console.log(`✅ Successfully added ${data?.length || 0} test barcodes`)
    
    // Show all test barcodes
    console.log('\n📋 Available test barcodes:')
    testBarcodes.forEach(item => {
      const isNew = newBarcodes.some(newItem => newItem.barcode === item.barcode)
      const status = isNew ? '🆕 NEW' : '✅ EXISTS'
      console.log(`   ${status} ${item.barcode} - ${item.material} (${item.cm}cm, ${item.mikron}μ)`)
    })
    
    console.log('\n🎯 Test Instructions:')
    console.log('1. Go to: https://localhost:3000/barcode-scanner')
    console.log('2. Try scanning or manually enter these barcodes:')
    testBarcodes.forEach(item => {
      console.log(`   • ${item.barcode}`)
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function removeTestBarcodes() {
  try {
    console.log('🗑️  Removing test barcodes...')
    
    const { data, error } = await supabase
      .from('warehouse_items')
      .delete()
      .in('barcode', testBarcodes.map(item => item.barcode))
      .select()
    
    if (error) {
      console.error('❌ Error removing test barcodes:', error)
      return
    }
    
    console.log(`✅ Successfully removed ${data?.length || 0} test barcodes`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Command line arguments
const command = process.argv[2]

if (command === 'add' || !command) {
  addTestBarcodes()
} else if (command === 'remove') {
  removeTestBarcodes()
} else if (command === 'list') {
  console.log('📋 Available test barcodes:')
  testBarcodes.forEach(item => {
    console.log(`   • ${item.barcode} - ${item.material} (${item.cm}cm, ${item.mikron}μ)`)
  })
} else {
  console.log('💡 Usage:')
  console.log('  node scripts/add-test-barcodes.js add     # Add test barcodes (default)')
  console.log('  node scripts/add-test-barcodes.js remove  # Remove test barcodes')
  console.log('  node scripts/add-test-barcodes.js list    # List test barcodes')
}