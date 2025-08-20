const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Environment variables'ları manuel olarak yükle
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local')
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

async function applyMigration() {
  try {
    console.log('🚀 Applying database migration...')
    
    // Step 1: Add stock_type column
    console.log('📝 Step 1: Adding stock_type column...')
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE warehouse_items 
            ADD COLUMN stock_type VARCHAR(20) DEFAULT 'general' 
            CHECK (stock_type IN ('general', 'customer'));`
    })
    
    if (error1) {
      console.error('❌ Error adding stock_type column:', error1)
      return false
    }
    console.log('✅ stock_type column added successfully')
    
    // Step 2: Add customer_name column
    console.log('📝 Step 2: Adding customer_name column...')
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE warehouse_items 
            ADD COLUMN customer_name VARCHAR(255);`
    })
    
    if (error2) {
      console.error('❌ Error adding customer_name column:', error2)
      return false
    }
    console.log('✅ customer_name column added successfully')
    
    // Step 3: Update existing records based on order_id
    console.log('📝 Step 3: Updating existing records...')
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `UPDATE warehouse_items 
            SET stock_type = CASE 
              WHEN order_id IS NOT NULL THEN (
                SELECT CASE 
                  WHEN o.customer IS NOT NULL AND o.customer != '' THEN 'customer'
                  ELSE 'general'
                END
                FROM orders o 
                WHERE o.id = warehouse_items.order_id
              )
              ELSE 'general'
            END;`
    })
    
    if (error3) {
      console.error('❌ Error updating stock_type:', error3)
      return false
    }
    console.log('✅ stock_type values updated successfully')
    
    // Step 4: Update customer_name from orders table
    console.log('📝 Step 4: Updating customer names...')
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: `UPDATE warehouse_items 
            SET customer_name = (
              SELECT o.customer
              FROM orders o 
              WHERE o.id = warehouse_items.order_id
              AND o.customer IS NOT NULL 
              AND o.customer != ''
            )
            WHERE order_id IS NOT NULL;`
    })
    
    if (error4) {
      console.error('❌ Error updating customer_name:', error4)
      return false
    }
    console.log('✅ customer_name values updated successfully')
    
    // Step 5: Add indexes
    console.log('📝 Step 5: Adding indexes...')
    const { error: error5 } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_warehouse_items_stock_type ON warehouse_items(stock_type);`
    })
    
    if (error5) {
      console.error('❌ Error adding stock_type index:', error5)
      return false
    }
    
    const { error: error6 } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_warehouse_items_customer_name ON warehouse_items(customer_name);`
    })
    
    if (error6) {
      console.error('❌ Error adding customer_name index:', error6)
      return false
    }
    console.log('✅ Indexes added successfully')
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error during migration:', error)
    return false
  }
}

async function verifyMigration() {
  try {
    console.log('🔍 Verifying migration...')
    
    // Check stock type distribution
    const { data: stats, error } = await supabase
      .from('warehouse_items')
      .select('stock_type')
    
    if (error) {
      console.error('❌ Error verifying migration:', error)
      return false
    }
    
    const stockTypeStats = stats.reduce((acc, item) => {
      const type = item.stock_type || 'null'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Stock type distribution:', stockTypeStats)
    
    // Check customer stock breakdown
    const { data: customerStats, error: customerError } = await supabase
      .from('warehouse_items')
      .select('customer_name, current_weight')
      .eq('stock_type', 'customer')
      .not('customer_name', 'is', null)
    
    if (customerError) {
      console.error('❌ Error getting customer stats:', customerError)
      return false
    }
    
    const customerBreakdown = customerStats.reduce((acc, item) => {
      const customer = item.customer_name || 'Unknown'
      if (!acc[customer]) {
        acc[customer] = { items: 0, totalWeight: 0 }
      }
      acc[customer].items += 1
      acc[customer].totalWeight += item.current_weight || 0
      return acc
    }, {})
    
    console.log('👥 Customer stock breakdown:')
    Object.entries(customerBreakdown).forEach(([customer, stats]) => {
      console.log(`  ${customer}: ${stats.items} items, ${stats.totalWeight.toFixed(1)}kg`)
    })
    
    return true
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
    return false
  }
}

async function main() {
  console.log('🎯 Starting database migration process...\n')
  
  const migrationSuccess = await applyMigration()
  
  if (!migrationSuccess) {
    console.log('\n❌ Migration failed!')
    process.exit(1)
  }
  
  console.log('\n✅ Migration applied successfully!')
  
  const verificationSuccess = await verifyMigration()
  
  if (verificationSuccess) {
    console.log('\n🎉 Migration completed and verified successfully!')
    console.log('📝 Next step: Update Product Return Dialog')
  } else {
    console.log('\n⚠️ Migration applied but verification failed')
  }
  
  process.exit(0)
}

main()
