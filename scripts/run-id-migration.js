const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ID generation function (same as in QR generator)
function generateWarehouseId(customerName) {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2) // YY
  const month = (now.getMonth() + 1).toString().padStart(2, '0') // MM
  const day = now.getDate().toString().padStart(2, '0') // DD
  
  // Get customer initial (first letter of customer name or 'G' for general)
  let customerInitial = 'G' // Default for general stock
  if (customerName && customerName.trim().length > 0) {
    customerInitial = customerName.trim().charAt(0).toUpperCase()
  }
  
  // Generate daily sequence (01-99)
  const sequence = Math.floor(Math.random() * 99) + 1
  const sequenceStr = sequence.toString().padStart(2, '0')
  
  return `DK${year}${month}${day}${customerInitial}${sequenceStr}`
}

async function migrateWarehouseItems() {
  console.log('🔄 ID Migration Başlatılıyor...')
  console.log('====================================')

  try {
    // Step 1: Get all existing warehouse items
    console.log('📋 Mevcut warehouse items alınıyor...')
    const { data: existingItems, error: fetchError } = await supabase
      .from('warehouse_items')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Veri alınamadı: ${fetchError.message}`)
    }

    console.log(`📦 ${existingItems.length} adet item bulundu`)

    // Step 2: Migrate each item to new table with new ID
    let migratedCount = 0
    let errorCount = 0
    const idMapping = {} // Old UUID -> New ID mapping

    for (const item of existingItems) {
      try {
        // Generate new ID based on customer info
        const customerName = item.customer_name || 
                           (item.stock_type === 'customer' ? 'Müşteri' : null)
        const newId = generateWarehouseId(customerName)
        
        // Store mapping for stock movements
        idMapping[item.id] = newId

        // Insert into new table
        const { error: insertError } = await supabase
          .from('warehouse_items_new')
          .insert({
            id: newId,
            barcode: item.barcode,
            order_id: item.order_id,
            material: item.material,
            cm: item.cm,
            mikron: item.mikron,
            current_weight: item.current_weight,
            original_weight: item.original_weight,
            coil_count: item.coil_count,
            original_coil_count: item.original_coil_count,
            status: item.status,
            stock_type: item.stock_type,
            customer_name: item.customer_name,
            location: item.location,
            supplier: item.supplier,
            notes: item.notes,
            tags: item.tags,
            qr_code: item.qr_code,
            code_type: item.code_type,
            created_at: item.created_at,
            updated_at: item.updated_at
          })

        if (insertError) {
          console.error(`❌ Item migration hatası (${item.id}):`, insertError.message)
          errorCount++
        } else {
          console.log(`✅ Migrated: ${item.id} -> ${newId} (${item.supplier})`)
          migratedCount++
        }

      } catch (error) {
        console.error(`❌ Item işlem hatası (${item.id}):`, error.message)
        errorCount++
      }
    }

    console.log(`\n📊 Warehouse Items Migration Özeti:`)
    console.log(`   ✅ Başarılı: ${migratedCount}`)
    console.log(`   ❌ Hatalı: ${errorCount}`)

    // Step 3: Migrate stock movements
    console.log('\n🔄 Stock movements migration başlatılıyor...')
    
    const { data: stockMovements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: true })

    if (movementsError) {
      console.error('Stock movements alınamadı:', movementsError.message)
    } else {
      let movementsMigrated = 0
      let movementsErrors = 0

      for (const movement of stockMovements) {
        try {
          const newWarehouseItemId = idMapping[movement.warehouse_item_id]
          
          if (!newWarehouseItemId) {
            console.warn(`⚠️  Warehouse item bulunamadı: ${movement.warehouse_item_id}`)
            movementsErrors++
            continue
          }

          const { error: movementInsertError } = await supabase
            .from('stock_movements_new')
            .insert({
              id: movement.id, // Keep same UUID for movements
              warehouse_item_id: newWarehouseItemId, // Use new TEXT ID
              barcode: movement.barcode,
              type: movement.type,
              quantity: movement.quantity,
              destination: movement.destination,
              operator: movement.operator,
              notes: movement.notes,
              order_id: movement.order_id,
              created_at: movement.created_at
            })

          if (movementInsertError) {
            console.error(`❌ Movement migration hatası:`, movementInsertError.message)
            movementsErrors++
          } else {
            movementsMigrated++
          }

        } catch (error) {
          console.error(`❌ Movement işlem hatası:`, error.message)
          movementsErrors++
        }
      }

      console.log(`\n📊 Stock Movements Migration Özeti:`)
      console.log(`   ✅ Başarılı: ${movementsMigrated}`)
      console.log(`   ❌ Hatalı: ${movementsErrors}`)
    }

    console.log('\n🎉 ID Migration Tamamlandı!')
    console.log('\n📋 Sonraki Adımlar:')
    console.log('   1. Yeni tabloları test edin')
    console.log('   2. Eski tabloları yedekleyin')
    console.log('   3. Tablo isimlerini değiştirin (warehouse_items -> warehouse_items_old)')
    console.log('   4. Yeni tabloları aktif hale getirin (warehouse_items_new -> warehouse_items)')

  } catch (error) {
    console.error('❌ Migration hatası:', error.message)
    process.exit(1)
  }
}

// Run migration
migrateWarehouseItems()