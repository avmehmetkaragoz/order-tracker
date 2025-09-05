import QRCode from 'qrcode'

// DEBUG QR Generator - Simplified version with colored borders
export class DebugQRGenerator {
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
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    } = {}
  ): Promise<string> {
    const { width = 200, margin = 4, color = { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel = 'M' } = options

    try {
      const dataURL = await QRCode.toDataURL(data, {
        width,
        margin,
        color,
        errorCorrectionLevel
      })
      return dataURL
    } catch (error) {
      console.error('QR Code data URL generation error:', error)
      throw new Error('QR kod oluşturulamadı')
    }
  }

  // Generate printable QR label HTML with DEBUG BORDERS
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
    // Parse specifications
    let cm = 0;
    let mikron = 0;
    
    try {
      if (data.specifications) {
        const specs = data.specifications.toLowerCase();
        const cmMatch = specs.match(/(\d+)\s*cm/);
        if (cmMatch) {
          cm = parseInt(cmMatch[1]) || 0;
        }
        const mikronMatch = specs.match(/x\s*(\d+)(?:\s*[μµ]|mikron)/);
        if (mikronMatch) {
          mikron = parseInt(mikronMatch[1]) || 0;
        }
      }
    } catch (error) {
      console.warn('Specifications parsing error:', error);
      cm = 0;
      mikron = 0;
    }

    const qrData = this.generateQRData({
      id: data.id,
      material: data.material,
      cm: cm,
      mikron: mikron,
      weight: data.weight,
      supplier: data.supplier,
      date: data.date,
      customer: data.customer,
      stockType: data.stockType,
      location: data.location,
      bobinCount: data.bobinCount
    })

    let qrCodeDataURL;
    try {
      qrCodeDataURL = await this.generateDataURL(qrData, {
        width: 1200,
        margin: 4,
        errorCorrectionLevel: 'H'
      })
    } catch (error) {
      console.error('QR code generation failed:', error);
      qrCodeDataURL = await this.generateDataURL(data.id, {
        width: 1200,
        margin: 4
      })
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="print-color-adjust" content="exact">
          <meta name="color-scheme" content="light">
          <title>🎯 DEBUG QR Etiketi - ${data.id}</title>
          <style>
            /* 🎯 DEBUG SISTEMLI QR KOD ETİKETİ - RENKLI BORDERLAR HER YERDE GÖRÜNÜR */
            
            /* 🏷️ ZEBRA ZD220 NATIVE FORMAT - INCH BAZLI */
            .label {
              width: 4in !important;  /* Zebra ZD220 native size */
              height: 4in !important;
              margin: 0 auto !important;
              padding: 0.1in !important;  /* Minimal padding */
              border: 0.1in solid red !important;  /* 🔴 DEBUG: Zebra format test */
              background: white !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              transform: scale(1) !important;
            }
            
            .header {
              width: 100% !important;
              height: 1in !important;  /* 🏷️ ZEBRA INCH FORMAT */
              font-size: 24pt !important;
              font-weight: bold !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              margin-bottom: 0.2in !important;
              border: 0.05in solid blue !important;  /* 🔵 DEBUG: Inch format */
              padding: 0.1in !important;
              box-sizing: border-box !important;
            }
            
            .id-display {
              width: 100% !important;
              text-align: center !important;
              font-family: monospace !important;
              font-size: 28pt !important;
              font-weight: bold !important;
              margin: 0.2in 0 !important;
              padding: 0.1in !important;
              border: 0.03in dashed black !important;
              background: #f8f9fa !important;
              box-sizing: border-box !important;
            }
            
            .main-content {
              width: 100% !important;
              height: 2.5in !important;  /* 🏷️ ZEBRA NATIVE HEIGHT */
              display: flex !important;
              gap: 0.1in !important;
              margin: 0.1in 0 !important;
              border: 0.05in solid green !important;  /* 🟢 DEBUG: Main content */
              padding: 0.05in !important;
              box-sizing: border-box !important;
            }
            
            .qr-section {
              width: 45% !important;
              height: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: 0.05in solid orange !important;  /* 🟠 DEBUG: QR section */
              padding: 0.05in !important;
              box-sizing: border-box !important;
            }
            
            .qr-code img {
              width: 2in !important;  /* 🏷️ ZEBRA OPTIMAL QR SIZE */
              height: 2in !important;
              object-fit: contain !important;
              border: 0.02in solid black !important;
            }
            
            .info-section {
              width: 45% !important;
              height: 100% !important;
              display: flex !important;
              flex-direction: column !important;
              border: 0.05in solid purple !important;  /* 🟣 DEBUG: Info section */
              padding: 0.05in !important;
              box-sizing: border-box !important;
            }
            
            .specs {
              font-size: 14pt !important;
              font-weight: bold !important;
              text-align: center !important;
              margin-bottom: 0.1in !important;
              padding: 0.05in !important;
              background: #f0f8ff !important;
              border: 0.02in solid black !important;
              box-sizing: border-box !important;
            }
            
            .info {
              font-size: 12pt !important;
              line-height: 1.2 !important;
              flex: 1 !important;
            }
            
            .info-row {
              display: flex !important;
              justify-content: space-between !important;
              margin-bottom: 0.05in !important;
            }
            
            .info-label {
              font-weight: bold !important;
              font-size: 12pt !important;
            }
            
            .info-value {
              font-size: 12pt !important;
              text-align: right !important;
            }
            
            .footer {
              width: 100% !important;
              height: 0.5in !important;  /* 🏷️ ZEBRA FOOTER SIZE */
              margin-top: 0.1in !important;
              padding: 0.05in !important;
              background: #e3f2fd !important;
              text-align: center !important;
              font-size: 10pt !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border: 0.05in solid cyan !important;  /* 🔵 DEBUG: Footer */
              box-sizing: border-box !important;
            }

            /* 🏷️ ZEBRA ZD220 LABEL PRINTER FORMAT */
            @media print {
              @page {
                size: 4in 4in !important;  /* Zebra ZD220 native size */
                margin: 0in !important;
                padding: 0in !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              html {
                width: 10cm !important;
                height: 10cm !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                zoom: 1 !important;
                transform: scale(1) !important;
              }
              
              body {
                width: 10cm !important;
                height: 10cm !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                zoom: 1 !important;
                transform: scale(1) !important;
                display: block !important;
              }
              
              .no-print, .preview-container {
                display: none !important;
                visibility: hidden !important;
                position: absolute !important;
                left: -9999mm !important;
                width: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
              }
              
              .label {
                position: absolute !important;
                top: 0mm !important;
                left: 0mm !important;
                width: 10cm !important;
                height: 10cm !important;
                margin: 0 !important;
                padding: 2mm !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                break-inside: avoid !important;
                overflow: hidden !important;
                transform: scale(1) !important;
                zoom: 1 !important;
              }
              
              /* Prevent all child elements from page breaks */
              .label * {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                overflow: visible !important;
              }
              
              /* Optimize spacing for 10cm print */
              .header {
                height: 8mm !important;
                margin-bottom: 1mm !important;
                padding: 1mm !important;
              }
              
              .id-display {
                margin: 1mm 0 !important;
                padding: 1mm !important;
              }
              
              .main-content {
                margin: 1mm 0 !important;
                padding: 1mm !important;
                gap: 2mm !important;
              }
              
              .qr-section {
                padding: 1mm !important;
              }
              
              .info-section {
                padding: 1mm !important;
              }
              
              .qr-code img {
                width: 25mm !important;
                height: 25mm !important;
              }
              
              .footer {
                height: 8mm !important;
                margin-top: 1mm !important;
                padding: 1mm !important;
              }
              
              /* Force colors to print */
              * {
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }

            /* Screen styles */
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            
            .preview-container {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="preview-container no-print">
            <h3>🎯 DEBUG QR Kod Etiketi</h3>
            <p>Renkli border'lar ile layout debug sistemi</p>
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              🖨️ DEBUG Yazdır
            </button>
          </div>
          
          <div class="label">
            <div class="header">
              <span>DEKA</span>
              <span>ANA/PALET ETİKETİ</span>
              <span>QR</span>
            </div>
            
            <div class="id-display">${data.id}</div>
            
            <div class="main-content">
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
                    <span class="info-value">${data.customer}</span>
                  </div>` : ''}
                  <div class="info-row">
                    <span class="info-label">Tarih:</span>
                    <span class="info-value">${data.date}</span>
                  </div>
                </div>
              </div>
              
              <div class="qr-section">
                <div class="qr-code">
                  <img src="${qrCodeDataURL}" alt="QR Kod: ${data.id}">
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div>📱 QR kod ile hızlı erişim</div>
            </div>
          </div>
        </body>
      </html>
    `
  }
}
