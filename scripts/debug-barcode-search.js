#!/usr/bin/env node

/**
 * Barcode Search Debug Script
 * 
 * This script helps debug barcode search issues by showing
 * what's actually in the database and testing the search function.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('🔍 Barcode Search Debug Tool')
console.log('============================\n')

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

async function listAllBarcodes() {
  try {
    console.log('📦 Fetching all warehouse items...')
    
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('id, barcode, material, supplier, status')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching warehouse items:', error)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('📭 No warehouse items found in database')
      return
    }
    
    console.log(`📋 Found ${data.length} warehouse items:`)
    console.log('─'.repeat(80))
    
    data.forEach((item, index) => {
      console.log(`${index + 1}. ${item.barcode} - ${item.material} (${item.supplier}) [${item.status}]`)
    })
    
    console.log('─'.repeat(80))
    
    return data
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function searchBarcode(searchTerm) {
  try {
    console.log(`🔍 Searching for barcode: "${searchTerm}"`)
    console.log('─'.repeat(50))
    
    // Test 1: Exact match
    console.log('Test 1: Exact match (eq)')
    const { data: exactData, error: exactError } = await supabase
      .from('warehouse_items')
      .select('*')
      .eq('barcode', searchTerm)
      .maybeSingle()
    
    if (exactError) {
      console.log('❌ Exact match error:', exactError.message)
    } else if (exactData) {
      console.log('✅ Exact match found:', exactData.barcode)
    } else {
      console.log('❌ No exact match found')
    }
    
    // Test 2: Case-insensitive exact match
    console.log('\nTest 2: Case-insensitive exact match')
    const { data: allItems, error: allError } = await supabase
      .from('warehouse_items')
      .select('*')
    
    if (allError) {
      console.log('❌ Error fetching all items:', allError.message)
    } else {
      const caseInsensitiveMatch = allItems?.find(item => 
        item.barcode?.toUpperCase() === searchTerm.toUpperCase()
      )
      
      if (caseInsensitiveMatch) {
        console.log('✅ Case-insensitive match found:', caseInsensitiveMatch.barcode)
      } else {
        console.log('❌ No case-insensitive match found')
      }
    }
    
    // Test 3: Partial match
    console.log('\nTest 3: Partial match')
    const partialMatch = allItems?.find(item => 
      item.barcode?.toUpperCase().includes(searchTerm.toUpperCase())
    )
    
    if (partialMatch) {
      console.log('✅ Partial match found:', partialMatch.barcode)
    } else {
      console.log('❌ No partial match found')
    }
    
    // Test 4: Show similar barcodes
    console.log('\nTest 4: Similar barcodes')
    const similarBarcodes = allItems?.filter(item => {
      const barcode = item.barcode?.toUpperCase() || ''
      const search = searchTerm.toUpperCase()
      
      // Check if they share at least 50% of characters
      let matchCount = 0
      const minLength = Math.min(barcode.length, search.length)
      
      for (let i = 0; i < minLength; i++) {
        if (barcode[i] === search[i]) {
          matchCount++
        }
      }
      
      return matchCount / Math.max(barcode.length, search.length) > 0.5
    })
    
    if (similarBarcodes && similarBarcodes.length > 0) {
      console.log('🔍 Similar barcodes found:')
      similarBarcodes.forEach(item => {
        console.log(`   • ${item.barcode}`)
      })
    } else {
      console.log('❌ No similar barcodes found')
    }
    
    // Test 5: Character analysis
    console.log('\nTest 5: Character analysis')
    console.log(`Search term: "${searchTerm}"`)
    console.log(`Length: ${searchTerm.length}`)
    console.log(`Characters: ${searchTerm.split('').join(', ')}`)
    console.log(`Uppercase: "${searchTerm.toUpperCase()}"`)
    
    if (allItems && allItems.length > 0) {
      console.log('\nFirst few barcodes in database:')
      allItems.slice(0, 5).forEach(item => {
        console.log(`   • "${item.barcode}" (length: ${item.barcode?.length || 0})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Command line arguments
const command = process.argv[2]
const searchTerm = process.argv[3]

if (command === 'list') {
  listAllBarcodes()
} else if (command === 'search' && searchTerm) {
  searchBarcode(searchTerm)
} else if (command === 'test') {
  // Test with the specific barcode mentioned
  searchBarcode('WH967843EU2ZMM')
} else {
  console.log('💡 Usage:')
  console.log('  node scripts/debug-barcode-search.js list                    # List all barcodes')
  console.log('  node scripts/debug-barcode-search.js search <barcode>        # Search for specific barcode')
  console.log('  node scripts/debug-barcode-search.js test                    # Test with WH967843EU2ZMM')
  console.log('\nExamples:')
  console.log('  node scripts/debug-barcode-search.js search WH967843EU2ZMM')
  console.log('  node scripts/debug-barcode-search.js test')
}