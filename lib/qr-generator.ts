import QRCode from 'qrcode'

// QR Code generation utility for warehouse items
export class QRGenerator {
  // Generate QR code data structure
  static generateQRData(data: {
    id: string
    material: string
    cm: number
    mikron: number
    weight: number
    supplier: string
    date: string
    customer?: string
    stockType?: string
    location?: string
    bobinCount?: number
  }): string {
    const qrData = {
      id: data.id,
      type: 'warehouse_item',
      material: data.material,
      specs: `${data.cm}cm x ${data.mikron}μ`,
      weight: data.weight,
      supplier: data.supplier,
      date: data.date,
      customer: data.customer,
      stockType: data.stockType || 'general',
      location: data.location || 'Depo',
      bobinCount: data.bobinCount || 1,
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/warehouse/${data.id}`,
      timestamp: new Date().toISOString()
    }

    return JSON.stringify(qrData)
  }

  // Generate QR code as SVG
  static async generateSVG(
    data: string,
    options: {
      width?: number
      margin?: number
      color?: {
        dark?: string
        light?: string
      }
    } = {}
  ): Promise<string> {
    const { width = 200, margin = 4, color = { dark: '#000000', light: '#FFFFFF' } } = options

    try {
      const svg = await QRCode.toString(data, {
        type: 'svg',
        width,
        margin,
        color,
        errorCorrectionLevel: 'M' // Medium error correction
      })
      return svg
    } catch (error) {
      console.error('QR Code SVG generation error:', error)
      throw new Error('QR kod oluşturulamadı')
    }
  }

  // Generate QR code as data URL
  static async generateDataURL(
    data: string,
    options: {
      width?: number
      margin?: number
      color?: {
        dark?: string
        light?: string
      }
    } = {}
  ): Promise<string> {
    const { width = 200, margin = 4, color = { dark: '#000000', light: '#FFFFFF' } } = options

    try {
      const dataURL = await QRCode.toDataURL(data, {
        width,
        margin,
        color,
        errorCorrectionLevel: 'M'
      })
      return dataURL
    } catch (error) {
      console.error('QR Code data URL generation error:', error)
      throw new Error('QR kod oluşturulamadı')
    }
  }

  // Generate printable QR label HTML
  static async generatePrintableLabel(data: {
    id: string
    title: string
    material: string
    specifications: string
    weight: number
    supplier: string
    date: string
    customer?: string
    stockType?: string
    location?: string
    bobinCount?: number
  }): Promise<string> {
    const qrData = this.generateQRData({
      id: data.id,
      material: data.material,
      cm: parseInt(data.specifications.split('cm')[0]) || 0,
      mikron: parseInt(data.specifications.split('x ')[1]) || 0,
      weight: data.weight,
      supplier: data.supplier,
      date: data.date,
      customer: data.customer,
      stockType: data.stockType,
      location: data.location,
      bobinCount: data.bobinCount
    })

    const qrCodeDataURL = await this.generateDataURL(qrData, {
      width: 300,
      margin: 1
    })

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Kod Etiketi - ${data.id}</title>
          <style>
            @media print {
              @page {
                size: 100mm 100mm;
                margin: 0;
              }
              html, body { 
                margin: 0; 
                padding: 0; 
                width: 100mm;
                height: 100mm;
                overflow: hidden;
              }
              .no-print { display: none !important; }
              .label {
                width: 100mm !important;
                height: 100mm !important;
                margin: 0 !important;
                padding: 3mm !important;
                border: none !important;
                page-break-after: avoid;
                box-sizing: border-box;
                position: absolute;
                top: 0;
                left: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .label {
              width: 10cm;
              height: 10cm;
              border: 2px solid #000;
              padding: 0.3cm;
              margin: 10px auto;
              background: white;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              page-break-after: always;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 0.2cm;
              border-bottom: 1px solid #ccc;
              padding-bottom: 0.1cm;
              height: 0.8cm;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 0.2cm;
            }
            .company-logo {
              height: 0.6cm;
              width: auto;
              max-width: 1cm;
              display: none; /* Hide image logo for print */
            }
            .company-text {
              font-family: Arial, sans-serif;
              font-weight: 900;
              font-size: 12px;
              color: #1e3a8a;
              letter-spacing: 1px;
              text-transform: uppercase;
              background: linear-gradient(45deg, #1e3a8a, #3b82f6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              display: inline-block;
            }
            @media print {
              .company-text {
                background: none;
                -webkit-text-fill-color: #1e3a8a;
                color: #1e3a8a;
              }
            }
            .header-text {
              font-size: 10px;
              font-weight: bold;
            }
            .qr-badge {
              background: #007bff;
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 8px;
              font-weight: bold;
            }
            .main-content {
              display: flex;
              flex: 1;
              gap: 0.3cm;
            }
            .qr-section {
              width: 4.5cm;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .qr-code {
              width: 4.2cm;
              height: 4.2cm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              border: 1px solid #eee;
              border-radius: 2px;
            }
            .info-section {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .id-display {
              font-family: monospace;
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.3cm;
              padding: 0.2cm;
              background: #f8f9fa;
              border-radius: 3px;
              border: 2px dashed #6c757d;
            }
            .specs {
              font-size: 13px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.3cm;
              padding: 0.2cm;
              background: #f0f8ff;
              border-radius: 3px;
              border: 2px solid #007bff;
            }
            .info {
              font-size: 11px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.15cm;
              padding: 0.05cm 0;
            }
            .info-label {
              font-weight: bold;
              color: #333;
              font-size: 11px;
            }
            .info-value {
              text-align: right;
              max-width: 55%;
              word-wrap: break-word;
              font-weight: 600;
              font-size: 11px;
            }
            .footer {
              margin-top: 0.3cm;
              padding: 0.2cm;
              background: #e3f2fd;
              border-radius: 3px;
              text-align: center;
              border: 1px solid #1976d2;
            }
            .footer-text {
              font-size: 9px;
              color: #1976d2;
              font-weight: bold;
            }
            .footer-subtext {
              font-size: 8px;
              color: #666;
              margin-top: 0.1cm;
            }
            .print-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin: 20px auto;
              display: block;
            }
            .print-button:hover {
              background: #0056b3;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">🖨️ Yazdır (10cm x 10cm)</button>
          
          <div class="label">
            <div class="header">
              <div class="header-left">
                <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/images/company-logo.png" alt="DEKA" class="company-logo" onerror="this.style.display='none'">
                <span class="company-text">DEKA</span>
                <span class="header-text">ANA/PALET ETİKETİ</span>
              </div>
              <span class="qr-badge">QR</span>
            </div>
            
            <div class="id-display">${data.id}</div>
            
            <div class="main-content">
              <div class="qr-section">
                <div class="qr-code">
                  <img src="${qrCodeDataURL}" alt="QR Kod: ${data.id}">
                </div>
              </div>
              
              <div class="info-section">
                <div class="specs">${data.specifications}</div>
                
                <div class="info">
                  <div class="info-row">
                    <span class="info-label">Ağırlık:</span>
                    <span class="info-value">${data.weight} kg</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Tedarikçi:</span>
                    <span class="info-value">${data.supplier}</span>
                  </div>
                  ${data.customer ? `<div class="info-row">
                    <span class="info-label">Müşteri:</span>
                    <span class="info-value" style="font-weight: bold; color: #007bff;">${data.customer}</span>
                  </div>` : ''}
                  <div class="info-row">
                    <span class="info-label">Konum:</span>
                    <span class="info-value">${data.location || 'Depo'}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Tarih:</span>
                    <span class="info-value">${data.date}</span>
                  </div>
                  ${data.bobinCount && data.bobinCount > 1 ? `<div class="info-row">
                    <span class="info-label">Bobin:</span>
                    <span class="info-value">${data.bobinCount} adet</span>
                  </div>` : ''}
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">📱 QR kod ile hızlı erişim</div>
              <div class="footer-subtext">Mobil cihazınızla tarayın • Sistem: DEKA Depo Yönetimi</div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Generate coil QR codes
  static generateCoilQRCode(parentId: string, coilIndex: number): string {
    return `${parentId}-C${String(coilIndex + 1).padStart(2, "0")}`
  }

  // Generate multiple coil labels with QR codes
  static async generateMultipleCoilLabels(data: {
    parentId: string
    title: string
    material: string
    specifications: string
    totalWeight: number
    coilCount: number
    supplier: string
    date: string
    customer?: string
    stockType?: string
    location?: string
  }): Promise<string> {
    const weightPerCoil = Math.round((data.totalWeight / data.coilCount) * 100) / 100
    let labelsHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bobin QR Kod Etiketleri - ${data.parentId}</title>
          <style>
            @media print {
              @page {
                size: 100mm 100mm;
                margin: 0;
              }
              html, body { 
                margin: 0; 
                padding: 0; 
                width: 100mm;
                height: 100mm;
                overflow: hidden;
              }
              .no-print { display: none !important; }
              .label {
                width: 100mm !important;
                height: 100mm !important;
                margin: 0 !important;
                padding: 3mm !important;
                border: none !important;
                page-break-after: avoid;
                box-sizing: border-box;
                position: relative;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .label {
              width: 10cm;
              height: 10cm;
              border: 2px solid #000;
              padding: 0.3cm;
              margin: 10px auto;
              background: white;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              page-break-after: always;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 0.2cm;
              border-bottom: 1px solid #ccc;
              padding-bottom: 0.1cm;
              height: 0.7cm;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 0.2cm;
            }
            .company-logo {
              height: 0.5cm;
              width: auto;
              max-width: 0.8cm;
              display: none; /* Hide image logo for print */
            }
            .company-text {
              font-family: Arial, sans-serif;
              font-weight: 900;
              font-size: 10px;
              color: #1e3a8a;
              letter-spacing: 1px;
              text-transform: uppercase;
              background: linear-gradient(45deg, #1e3a8a, #3b82f6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              display: inline-block;
            }
            @media print {
              .company-text {
                background: none;
                -webkit-text-fill-color: #1e3a8a;
                color: #1e3a8a;
              }
            }
            .header-text {
              font-size: 9px;
              font-weight: bold;
            }
            .coil-number {
              background: #007bff;
              color: white;
              padding: 0.1cm 0.2cm;
              border-radius: 3px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.2cm;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.1cm;
              font-size: 10px;
            }
            .qr-badge {
              background: rgba(255,255,255,0.2);
              padding: 1px 4px;
              border-radius: 2px;
              font-size: 7px;
            }
            .id-display {
              font-family: monospace;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.2cm;
              padding: 0.1cm;
              background: #f8f9fa;
              border-radius: 2px;
              border: 1px dashed #6c757d;
            }
            .qr-section {
              display: flex;
              justify-content: center;
              margin-bottom: 0.3cm;
            }
            .qr-code {
              width: 4.5cm;
              height: 4.5cm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              border: 1px solid #eee;
              border-radius: 2px;
            }
            .specs {
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.2cm;
              padding: 0.1cm;
              background: #f0f8ff;
              border-radius: 2px;
              border: 1px solid #007bff;
            }
            .info {
              font-size: 8px;
              line-height: 1.2;
              flex: 1;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.05cm;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              text-align: right;
              max-width: 60%;
              word-wrap: break-word;
            }
            .footer {
              margin-top: auto;
              padding: 0.1cm;
              background: #e3f2fd;
              border-radius: 2px;
              text-align: center;
            }
            .footer-text {
              font-size: 6px;
              color: #1976d2;
              font-weight: bold;
            }
            .print-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin: 20px auto;
              display: block;
            }
            .print-button:hover {
              background: #0056b3;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">🖨️ Tüm Bobin QR Etiketlerini Yazdır (10cm x 10cm)</button>
    `

    // Generate a label for each coil
    for (let i = 0; i < data.coilCount; i++) {
      const coilId = this.generateCoilQRCode(data.parentId, i)
      const coilQRData = this.generateQRData({
        id: coilId,
        material: data.material,
        cm: parseInt(data.specifications.split('cm')[0]) || 0,
        mikron: parseInt(data.specifications.split('x ')[1]) || 0,
        weight: weightPerCoil,
        supplier: data.supplier,
        date: data.date,
        customer: data.customer,
        stockType: data.stockType,
        location: data.location,
        bobinCount: 1
      })

      const qrCodeDataURL = await this.generateDataURL(coilQRData, {
        width: 200,
        margin: 2
      })

      labelsHTML += `
        <div class="label">
          <div class="header">
            <div class="header-left">
              <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/images/company-logo.png" alt="DEKA" class="company-logo" onerror="this.style.display='none'">
              <span class="company-text">DEKA</span>
              <span class="header-text">BOBİN ETİKETİ</span>
            </div>
          </div>
          
          <div class="coil-number">
            BOBİN ${i + 1} / ${data.coilCount}
            <span class="qr-badge">QR</span>
          </div>
          
          <div class="id-display">${coilId}</div>
          
          <div class="qr-section">
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR Kod: ${coilId}">
            </div>
          </div>
          
          <div class="specs">${data.specifications}</div>
          
          <div class="info">
            <div class="info-row">
              <span class="info-label">Tahmini Ağırlık:</span>
              <span class="info-value">${weightPerCoil} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tedarikçi:</span>
              <span class="info-value">${data.supplier}</span>
            </div>
            ${data.customer ? `<div class="info-row">
              <span class="info-label">Müşteri:</span>
              <span class="info-value" style="font-weight: bold; color: #007bff;">${data.customer}</span>
            </div>` : ''}
            <div class="info-row">
              <span class="info-label">Tarih:</span>
              <span class="info-value">${data.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ana Ürün:</span>
              <span class="info-value" style="font-family: monospace;">${data.parentId}</span>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">📱 QR kod ile hızlı erişim</div>
          </div>
        </div>
      `
    }

    labelsHTML += `
        </body>
      </html>
    `

    return labelsHTML
  }

  // Generate return QR labels
  static async generateReturnLabels(data: {
    parentQRCode: string
    title: string
    specifications: string
    supplier: string
    customer?: string
    returnQRCodes: Array<{
      qrCode: string
      weight: number
      date: string
      condition: string
      operator: string
      notes: string
    }>
  }): Promise<string> {
    let labelsHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dönüş QR Kod Etiketleri - ${data.parentQRCode}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
              .label {
                width: 10cm !important;
                height: 10cm !important;
                margin: 0 !important;
                border: none !important;
                page-break-after: always;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .label {
              width: 10cm;
              height: 10cm;
              border: 2px solid #ff6b35;
              padding: 0.3cm;
              margin: 10px auto;
              background: white;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              page-break-after: always;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 0.2cm;
              border-bottom: 1px solid #ff6b35;
              padding-bottom: 0.1cm;
              height: 0.7cm;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 0.2cm;
            }
            .company-text {
              font-family: Arial, sans-serif;
              font-weight: 900;
              font-size: 10px;
              color: #ff6b35;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .header-text {
              font-size: 9px;
              font-weight: bold;
              color: #ff6b35;
            }
            .return-badge {
              background: #ff6b35;
              color: white;
              padding: 0.1cm 0.2cm;
              border-radius: 3px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.2cm;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.1cm;
              font-size: 10px;
            }
            .qr-badge {
              background: #ff6b35;
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 8px;
              font-weight: bold;
            }
            .main-content {
              display: flex;
              flex: 1;
              gap: 0.3cm;
            }
            .info-section {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .id-display {
              font-family: monospace;
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.2cm;
              padding: 0.1cm;
              background: #fff5f0;
              border-radius: 2px;
              border: 1px dashed #ff6b35;
            }
            .qr-section {
              width: 4.5cm;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .qr-code {
              width: 4.2cm;
              height: 4.2cm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              border: 1px solid #eee;
              border-radius: 2px;
            }
            .specs {
              font-size: 13px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.3cm;
              padding: 0.2cm;
              background: #fff5f0;
              border-radius: 3px;
              border: 2px solid #ff6b35;
            }
            .condition {
              font-size: 10px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.3cm;
              padding: 0.15cm;
              border-radius: 3px;
            }
            .condition.kullanilabilir {
              background: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .condition.hasarli {
              background: #f8d7da;
              color: #721c24;
              border: 1px solid #f5c6cb;
            }
            .condition.kontrol-gerekli {
              background: #fff3cd;
              color: #856404;
              border: 1px solid #ffeaa7;
            }
            .info {
              font-size: 11px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.15cm;
              padding: 0.05cm 0;
            }
            .info-label {
              font-weight: bold;
              color: #333;
              font-size: 11px;
            }
            .info-value {
              text-align: right;
              max-width: 55%;
              word-wrap: break-word;
              font-weight: 600;
              font-size: 11px;
            }
            .footer {
              margin-top: 0.3cm;
              padding: 0.2cm;
              background: #fff5f0;
              border-radius: 3px;
              text-align: center;
              border: 1px solid #ff6b35;
            }
            .footer-text {
              font-size: 9px;
              color: #ff6b35;
              font-weight: bold;
            }
            .footer-subtext {
              font-size: 8px;
              color: #666;
              margin-top: 0.1cm;
            }
            .print-button {
              background: #ff6b35;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin: 20px auto;
              display: block;
            }
            .print-button:hover {
              background: #e55a2b;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">🖨️ Tüm Dönüş QR Etiketlerini Yazdır (10cm x 10cm)</button>
    `

    // Generate a label for each return QR code
    for (const returnQR of data.returnQRCodes) {
      const returnQRData = this.generateQRData({
        id: returnQR.qrCode,
        material: data.specifications.split(' • ')[2] || 'OPP',
        cm: parseInt(data.specifications.split('cm')[0]) || 0,
        mikron: parseInt(data.specifications.split('x ')[1]) || 0,
        weight: returnQR.weight,
        supplier: data.supplier,
        date: returnQR.date,
        customer: data.customer,
        stockType: 'general',
        location: 'Depo',
        bobinCount: 1
      })

      const qrCodeDataURL = await this.generateDataURL(returnQRData, {
        width: 200,
        margin: 2
      })

      const conditionClass = returnQR.condition.toLowerCase().replace(/\s+/g, '-')

      labelsHTML += `
        <div class="label">
          <div class="header">
            <div class="header-left">
              <span class="company-text">DEKA</span>
              <span class="header-text">DÖNÜŞ ETİKETİ</span>
            </div>
            <span class="qr-badge">QR</span>
          </div>
          
          <div class="return-badge">
            DÖNÜŞ BOBİNİ
          </div>
          
          <div class="id-display">${returnQR.qrCode}</div>
          
          <div class="main-content">
            <div class="qr-section">
              <div class="qr-code">
                <img src="${qrCodeDataURL}" alt="QR Kod: ${returnQR.qrCode}">
              </div>
            </div>
            
            <div class="info-section">
              <div class="specs">${data.specifications}</div>
              
              <div class="condition ${conditionClass}">
                DURUM: ${returnQR.condition.toUpperCase()}
              </div>
              
              <div class="info">
                <div class="info-row">
                  <span class="info-label">Ağırlık:</span>
                  <span class="info-value">${returnQR.weight.toFixed(1)} kg</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tedarikçi:</span>
                  <span class="info-value">${data.supplier}</span>
                </div>
                ${data.customer ? `<div class="info-row">
                  <span class="info-label">Müşteri:</span>
                  <span class="info-value" style="font-weight: bold; color: #ff6b35;">${data.customer}</span>
                </div>` : ''}
                <div class="info-row">
                  <span class="info-label">Dönüş Tarihi:</span>
                  <span class="info-value">${returnQR.date}</span>
                </div>
                ${returnQR.operator ? `<div class="info-row">
                  <span class="info-label">Teslim Alan:</span>
                  <span class="info-value">${returnQR.operator}</span>
                </div>` : ''}
                <div class="info-row">
                  <span class="info-label">Ana Ürün:</span>
                  <span class="info-value" style="font-family: monospace;">${data.parentQRCode}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">📱 Dönüş QR kodu ile takip</div>
          </div>
        </div>
      `
    }

    labelsHTML += `
        </body>
      </html>
    `

    return labelsHTML
  }

  // Parse QR code data
  static parseQRData(qrString: string): any {
    try {
      const data = JSON.parse(qrString)
      if (data.type === 'warehouse_item' && data.id) {
        return data
      }
      return null
    } catch (error) {
      console.error('QR code parse error:', error)
      return null
    }
  }

  // Generate warehouse item ID with new format: DK + YYMMDD + Customer + Sequence
  static generateWarehouseId(customerName?: string): string {
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
    // In a real implementation, this should be fetched from database
    // For now, we'll use a random number between 01-99
    const sequence = Math.floor(Math.random() * 99) + 1
    const sequenceStr = sequence.toString().padStart(2, '0')
    
    return `DK${year}${month}${day}${customerInitial}${sequenceStr}`
  }

  // Generate warehouse item ID (legacy method for backward compatibility)
  static generateLegacyWarehouseId(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `WH${timestamp.slice(-6)}${random}`
  }
}
