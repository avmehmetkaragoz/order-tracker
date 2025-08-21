// Simple ID format generator for testing (standalone)
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

function generateLegacyWarehouseId() {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `WH${timestamp.slice(-6)}${random}`
}

console.log('🧪 Yeni ID Format Testi')
console.log('======================')

// Test different customer scenarios
const testCases = [
  { customer: 'Ahmet Matbaacılık', description: 'Normal müşteri' },
  { customer: 'Bilgili Ofset', description: 'B harfi ile başlayan müşteri' },
  { customer: 'Mehmet Karton', description: 'M harfi ile başlayan müşteri' },
  { customer: '', description: 'Genel stok (müşteri yok)' },
  { customer: null, description: 'Null müşteri' },
  { customer: undefined, description: 'Undefined müşteri' }
]

console.log('\n📋 Test Sonuçları:')
console.log('------------------')

testCases.forEach((testCase, index) => {
  try {
    const newId = generateWarehouseId(testCase.customer)
    console.log(`${index + 1}. ${testCase.description}:`)
    console.log(`   Müşteri: "${testCase.customer || 'YOK'}"`)
    console.log(`   Yeni ID: ${newId}`)
    console.log(`   Uzunluk: ${newId.length} karakter`)
    console.log('')
  } catch (error) {
    console.error(`❌ Hata (${testCase.description}):`, error.message)
  }
})

// Test legacy format for comparison
console.log('🔄 Legacy Format Karşılaştırması:')
console.log('----------------------------------')
try {
  const legacyId = generateLegacyWarehouseId()
  const newId = generateWarehouseId('Test Müşteri')
  
  console.log(`Legacy ID: ${legacyId} (${legacyId.length} karakter)`)
  console.log(`Yeni ID:   ${newId} (${newId.length} karakter)`)
  console.log(`Fark:      ${legacyId.length - newId.length} karakter daha kısa`)
} catch (error) {
  console.error('❌ Karşılaştırma hatası:', error.message)
}

// Test ID format parsing
console.log('\n🔍 ID Format Analizi:')
console.log('---------------------')
const sampleId = generateWarehouseId('Örnek Müşteri')
console.log(`Örnek ID: ${sampleId}`)
console.log(`Format: DK + YYMMDD + Müşteri + Sıra`)
console.log(`DK: ${sampleId.substring(0, 2)} (Şirket kodu)`)
console.log(`Tarih: ${sampleId.substring(2, 8)} (YYMMDD)`)
console.log(`Müşteri: ${sampleId.substring(8, 9)} (İlk harf)`)
console.log(`Sıra: ${sampleId.substring(9, 11)} (Günlük sıra)`)

console.log('\n✅ Test tamamlandı!')