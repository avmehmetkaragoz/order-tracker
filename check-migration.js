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

async function checkMigration() {
  try {
    console.log('🔍 Checking database migration status...')
    
    // Check if stock_type and customer_name columns exist
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('stock_type, customer_name')
      .limit(1)
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Migration NOT applied - columns do not exist')
        console.log('Error:', error.message)
        return false
      } else {
        console.error('❌ Error checking migration:', error)
        return false
      }
    }
    
    console.log('✅ Migration appears to be applied - columns exist')
    
    // Check data distribution
    const { data: stats, error: statsError } = await supabase
      .from('warehouse_items')
      .select('stock_type')
    
    if (statsError) {
      console.error('❌ Error getting stats:', statsError)
      return true
    }
    
    const stockTypeStats = stats.reduce((acc, item) => {
      const type = item.stock_type || 'null'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Stock type distribution:', stockTypeStats)
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

checkMigration().then(migrationApplied => {
  if (migrationApplied) {
    console.log('\n✅ Database migration status: APPLIED')
  } else {
    console.log('\n❌ Database migration status: NOT APPLIED')
    console.log('📝 Next step: Apply the migration script')
  }
  process.exit(0)
})
