#!/usr/bin/env node

/**
 * Force Vercel Redeploy Script
 * 
 * Bu script Vercel deployment cache'ini temizlemek ve 
 * force redeploy yapmak için kullanılır.
 * 
 * ChunkLoadError sorunlarını çözmek için:
 * 1. Build cache'ini temizler
 * 2. Force redeploy tetikler
 * 3. Deployment durumunu kontrol eder
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Vercel Force Redeploy Script');
console.log('================================');

// 1. Local build cache temizle
console.log('\n1️⃣ Local build cache temizleniyor...');
try {
  if (fs.existsSync('.next')) {
    execSync('rmdir /s /q .next', { stdio: 'inherit' });
    console.log('✅ .next klasörü temizlendi');
  }
  
  if (fs.existsSync('node_modules/.cache')) {
    execSync('rmdir /s /q node_modules\\.cache', { stdio: 'inherit' });
    console.log('✅ node_modules cache temizlendi');
  }
} catch (error) {
  console.log('⚠️ Cache temizleme sırasında hata (normal olabilir):', error.message);
}

// 2. Package.json'da timestamp güncelle (force redeploy için)
console.log('\n2️⃣ Force redeploy için timestamp güncelleniyor...');
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Deployment timestamp ekle
packageJson.deploymentTimestamp = new Date().toISOString();
packageJson.forceRedeploy = Date.now();

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json güncellendi');

// 3. Git commit ve push
console.log('\n3️⃣ Git commit ve push yapılıyor...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "fix: Force Vercel redeploy - ChunkLoadError çözümü

🔧 Cache Temizleme:
- Local .next build cache temizlendi
- node_modules cache temizlendi
- Package.json timestamp güncellendi

🚀 Force Redeploy:
- Vercel deployment cache bypass
- Settings sayfası chunk loading sorunu çözümü
- Favicon.ico eklendi

⚡ Deployment Timestamp: ${new Date().toISOString()}"`, { stdio: 'inherit' });
  
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ GitHub\'a push edildi');
} catch (error) {
  console.error('❌ Git işlemi başarısız:', error.message);
  process.exit(1);
}

// 4. Vercel deployment durumu
console.log('\n4️⃣ Vercel Deployment Bilgileri:');
console.log('🌐 Production URL: https://takip.dekaplastik.com');
console.log('📊 Vercel Dashboard: https://vercel.com/dashboard');
console.log('⏱️ Deployment süresi: ~2-3 dakika');

console.log('\n✅ Force redeploy tamamlandı!');
console.log('\n📋 Sonraki Adımlar:');
console.log('1. Vercel dashboard\'da deployment\'ı izleyin');
console.log('2. Deployment tamamlandıktan sonra https://takip.dekaplastik.com/settings sayfasını test edin');
console.log('3. Browser cache\'ini temizleyin (Ctrl+F5)');
console.log('4. ChunkLoadError hatası çözülmüş olmalı');

console.log('\n🐛 Debug İpuçları:');
console.log('- F12 → Console\'da hata loglarını kontrol edin');
console.log('- Network tab\'ında chunk dosyalarının yüklendiğini doğrulayın');
console.log('- Hard refresh yapın (Ctrl+Shift+R)');