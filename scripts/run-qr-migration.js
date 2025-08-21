#!/usr/bin/env node

/**
 * QR Code Migration Script
 * 
 * This script migrates the database from barcode system to QR code system
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('🔄 QR Kod Migration Başlatılıyor...')
console.log('====================================\n')

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

// Migration functions
async function addQRColumns() {
  console.log('📝 Adding QR code columns...')
  
  try {
    // Note: We can't run DDL commands through the client API
    // These would need to be run directly in Supabase dashboard
    console.log('⚠️  DDL commands need to be run in Supabase dashboard:')
    console.log('   ALTER TABLE warehouse_items ADD COLUMN IF NOT EXISTS qr_code TEXT;')
    console.log('   ALTER TABLE warehouse_items ADD COLUMN IF NOT EXISTS code_type VARCHAR(10) DEFAULT \'qr\';')
    console.log('   CREATE INDEX IF NOT EXISTS idx_warehouse_qr_code ON warehouse_items(qr_code);')
    
    return true
  } catch (error) {
    console.error('❌ Error adding columns:', error.message)
    return false
  }
}

async function generateQRData(item) {
  const qrData = {
    id: item.barcode,
    type: 'warehouse_item',
    material: item.material,
    specs: `${item.cm}cm x ${item.mikron}μ`,
    weight: item.current_weight,
    supplier: item.supplier,
    date: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    customer: item.customer_name,
    stockType: item.stock_type || 'general',
    location: item.location || 'Depo',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.com'}/warehouse/${item.barcode}`,
    timestamp: new Date().toISOString()
  }
  
  return JSON.stringify(qrData)
}

async function updateExistingItems() {
  console.log('🔄 Updating existing items with QR codes...')
  
  try {
    // Get all existing items
    const { data: items, error } = await supabase
      .from('warehouse_items')
      .select('*')
    
    if (error) {
      throw error
    }
    
    console.log(`📦 Found ${items.length} items to update`)
    
    let updated = 0
    let errors = 0
    
    for (const item of items) {
      try {
        const qrCode = await generateQRData(item)
        
        const { error: updateError } = await supabase
          .from('warehouse_items')
          .update({
            qr_code: qrCode,
            code_type: 'qr'
          })
          .eq('id', item.id)
        
        if (updateError) {
          console.error(`❌ Error updating item ${item.barcode}:`, updateError.message)
          errors++
        } else {
          updated++
          if (updated % 10 === 0) {
            console.log(`   ✅ Updated ${updated}/${items.length} items`)
          }
        }
      } catch (itemError) {
        console.error(`❌ Error processing item ${item.barcode}:`, itemError.message)
        errors++
      }
    }
    
    console.log(`✅ Migration completed: ${updated} updated, ${errors} errors`)
    return { updated, errors }
    
  } catch (error) {
    console.error('❌ Error updating items:', error.message)
    return { updated: 0, errors: 1 }
  }
}

async function addTestQRItems() {
  console.log('🧪 Adding test QR items...')
  
  const testItems = [
    {
      barcode: `QR${Date.now()}001`,
      material: 'QR Test Kraft Kağıt',
      cm: 75,
      mikron: 85,
      current_weight: 1500.0,
      original_weight: 1500.0,
      coil_count: 3,
      original_coil_count: 3,
      status: 'Stokta',
      stock_type: 'customer',
      customer_name: 'QR Test Müşteri',
      location: 'QR Test Depo',
      supplier: 'QR Test Tedarikçi',
      notes: 'QR kod sistemi test ürünü',
      code_type: 'qr'
    },
    {
      barcode: `QR${Date.now()}002`,
      material: 'QR Test Oluklu Karton',
      cm: 120,
      mikron: 5,
      current_weight: 2000.0,
      original_weight: 2000.0,
      coil_count: 5,
      original_coil_count: 5,
      status: 'Stokta',
      stock_type: 'general',
      customer_name: null,
      location: 'Ana Depo',
      supplier: 'QR Test Karton A.Ş.',
      notes: 'QR kod sistemi genel stok test ürünü',
      code_type: 'qr'
    }
  ]
  
  let added = 0
  
  for (const item of testItems) {
    try {
      // Generate QR code for the item
      item.qr_code = await generateQRData(item)
      
      const { error } = await supabase
        .from('warehouse_items')
        .insert([item])
      
      if (error) {
        console.error(`❌ Error adding test item ${item.barcode}:`, error.message)
      } else {
        added++
        console.log(`   ✅ Added test item: ${item.barcode}`)
      }
    } catch (error) {
      console.error(`❌ Error processing test item ${item.barcode}:`, error.message)
    }
  }
  
  console.log(`✅ Added ${added} test QR items`)
  return added
}

async function showMigrationSummary() {
  console.log('\n📊 Migration Summary')
  console.log('===================')
  
  try {
    const { data: summary, error } = await supabase
      .from('warehouse_items')
      .select('code_type, current_weight')
    
    if (error) {
      throw error
    }
    
    const stats = summary.reduce((acc, item) => {
      const type = item.code_type || 'unknown'
      if (!acc[type]) {
        acc[type] = { count: 0, weight: 0 }
      }
      acc[type].count++
      acc[type].weight += item.current_weight || 0
      return acc
    }, {})
    
    Object.entries(stats).forEach(([type, data]) => {
      console.log(`${type.toUpperCase()}: ${data.count} items, ${data.weight.toFixed(1)}kg total`)
    })
    
    // Show sample QR data
    console.log('\n📱 Sample QR Data:')
    const { data: samples, error: sampleError } = await supabase
      .from('warehouse_items')
      .select('barcode, qr_code, code_type, material, status')
      .eq('code_type', 'qr')
      .limit(3)
    
    if (!sampleError && samples) {
      samples.forEach(item => {
        const qrPreview = item.qr_code ? 
          (item.qr_code.length > 80 ? item.qr_code.substring(0, 80) + '...' : item.qr_code) : 
          'No QR data'
        console.log(`   ${item.barcode}: ${qrPreview}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error generating summary:', error.message)
  }
}

// Main migration process
async function runMigration() {
  try {
    console.log('🚀 Starting QR Code Migration Process\n')
    
    // Step 1: Add columns (manual step)
    await addQRColumns()
    
    // Step 2: Update existing items
    const updateResult = await updateExistingItems()
    
    // Step 3: Add test items
    const testCount = await addTestQRItems()
    
    // Step 4: Show summary
    await showMigrationSummary()
    
    console.log('\n🎉 QR Code Migration Completed!')
    console.log(`   Updated: ${updateResult.updated} items`)
    console.log(`   Errors: ${updateResult.errors} items`)
    console.log(`   Test items added: ${testCount}`)
    
    console.log('\n📋 Next Steps:')
    console.log('   1. Run the DDL commands in Supabase dashboard')
    console.log('   2. Test QR code scanning functionality')
    console.log('   3. Update navigation to use QR scanner')
    console.log('   4. Replace barcode components with QR components')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()