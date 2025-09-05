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
    // Güvenli specifications parsing
    let cm = 0;
    let mikron = 0;
    
    try {
      // Farklı format olasılıklarını kontrol et
      if (data.specifications) {
        const specs = data.specifications.toLowerCase();
        
        // "100cm x 25μ" formatı
        const cmMatch = specs.match(/(\d+)\s*cm/);
        if (cmMatch) {
          cm = parseInt(cmMatch[1]) || 0;
        }
        
        // "x 25μ" veya "x 25mikron" formatı
        const mikronMatch = specs.match(/x\s*(\d+)(?:\s*[μµ]|mikron)/);
        if (mikronMatch) {
          mikron = parseInt(mikronMatch[1]) || 0;
        }
      }
    } catch (error) {
      console.warn('Specifications parsing error:', error);
      // Varsayılan değerler kullan
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
        width: 1200,  // 300dpi için yüksek çözünürlük
        margin: 4,    // Daha iyi kenar boşluğu
        errorCorrectionLevel: 'H'  // Maximum error correction for crisp printing
      })
    } catch (error) {
      console.error('QR code generation failed:', error);
      // Fallback: basit QR kod oluştur
      try {
        qrCodeDataURL = await this.generateDataURL(data.id, {
          width: 1200,
          margin: 4
        })
      } catch (fallbackError) {
        console.error('Fallback QR code generation failed:', fallbackError);
        throw new Error('QR kod oluşturulamadı: ' + (error as Error).message);
      }
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
          <title>QR Kod Etiketi - ${data.id}</title>
          <style>
            /* UNIVERSAL 10x10CM LABEL OPTIMIZATION - Works with any printer */
            @media print {
              /* Simple, universal page size */
              @page {
                size: 10cm 10cm !important;
                margin: 0mm !important;
                padding: 0mm !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              /* Root elements */
              html, body {
                margin: 0mm !important;
                padding: 0mm !important;
                width: 10cm !important;
                height: 10cm !important;
                font-family: Arial, sans-serif !important;
                font-size: 12pt !important;
                background: white !important;
                overflow: hidden !important;
              }
              
              /* Hide preview elements */
              .no-print, .preview-container {
                display: none !important;
                visibility: hidden !important;
                position: absolute !important;
                left: -9999mm !important;
              }
              
              /* Main label container - FULL 10x10cm */
              .label {
                position: absolute !important;
                top: 0mm !important;
                left: 0mm !important;
                width: 10cm !important;
                height: 10cm !important;
                margin: 0mm !important;
                padding: 3mm !important;
                border: 1mm solid red !important;  /* DEBUG: Red border to see actual size */
                background: white !important;
                box-sizing: border-box !important;
                overflow: visible !important;
                page-break-inside: avoid !important;
              }
              
              /* Header - fits proportionally */
              .header {
                width: 100% !important;
                height: 8mm !important;
                font-size: 10pt !important;
                font-weight: bold !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                margin-bottom: 2mm !important;
                border-bottom: 1pt solid black !important;
                padding-bottom: 1mm !important;
                border: 1pt solid blue !important;  /* DEBUG: Blue border */
              }
              
              /* ID Display */
              .id-display {
                width: 100% !important;
                text-align: center !important;
                font-family: monospace !important;
                font-size: 14pt !important;
                font-weight: bold !important;
                margin: 2mm 0 !important;
                padding: 2mm !important;
                border: 2pt dashed black !important;
                background: #f8f9fa !important;
                box-sizing: border-box !important;
              }
              
              /* Main content - Side by side layout */
              .main-content {
                width: 100% !important;
                height: 65mm !important;
                display: flex !important;
                gap: 3mm !important;
                margin: 2mm 0 !important;
                border: 1pt solid green !important;  /* DEBUG: Green border */
              }
              
              /* QR Code section - Takes left half */
              .qr-section {
                width: 45mm !important;
                height: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border: 1pt solid orange !important;  /* DEBUG: Orange border */
              }
              
              .qr-code {
                width: 40mm !important;
                height: 40mm !important;
                display: block !important;
              }
              
              .qr-code img {
                width: 40mm !important;
                height: 40mm !important;
                max-width: 40mm !important;
                max-height: 40mm !important;
                object-fit: contain !important;
                border: 1pt solid black !important;
              }
              
              /* Info section - Takes right half */
              .info-section {
                width: 45mm !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                border: 1pt solid purple !important;  /* DEBUG: Purple border */
              }
              
              .specs {
                font-size: 11pt !important;
                font-weight: bold !important;
                text-align: center !important;
                margin-bottom: 2mm !important;
                padding: 1mm !important;
                background: #f0f8ff !important;
                border: 1pt solid black !important;
                box-sizing: border-box !important;
              }
              
              .info {
                font-size: 9pt !important;
                line-height: 1.2 !important;
                flex: 1 !important;
              }
              
              .info-row {
                display: flex !important;
                justify-content: space-between !important;
                margin-bottom: 1mm !important;
                padding: 0.5mm 0 !important;
              }
              
              .info-label {
                font-weight: bold !important;
                font-size: 9pt !important;
              }
              
              .info-value {
                font-size: 9pt !important;
                text-align: right !important;
                max-width: 20mm !important;
                word-wrap: break-word !important;
              }
              
              /* Footer */
              .footer {
                width: 100% !important;
                height: 12mm !important;
                margin-top: 2mm !important;
                padding: 1mm !important;
                background: #e3f2fd !important;
                border: 1pt solid black !important;
                text-align: center !important;
                font-size: 8pt !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                box-sizing: border-box !important;
                border: 1pt solid cyan !important;  /* DEBUG: Cyan border */
              }
              
              .footer-text {
                font-size: 8pt !important;
                font-weight: bold !important;
                margin-bottom: 1mm !important;
              }
              
              .footer-subtext {
                font-size: 7pt !important;
                margin-top: 1mm !important;
              }
              
              /* Force black text for all elements */
              * {
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
                size: 100mm 100mm !important;
                margin: 0 !important;
              }
              
              @page :left {
                size: 100mm 100mm !important;
                margin: 0 !important;
              }
              
              @page :right {
                size: 100mm 100mm !important;
                margin: 0 !important;
              }
              
              /* Root elements - force exact mm dimensions */
              html {
                margin: 0 !important;
                padding: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
                min-width: 100mm !important;
                min-height: 100mm !important;
                max-width: 100mm !important;
                max-height: 100mm !important;
                font-size: 12pt !important;
                background: white !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
              }
              
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
                min-width: 100mm !important;
                min-height: 100mm !important;
                max-width: 100mm !important;
                max-height: 100mm !important;
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 12pt !important;
                background: white !important;
                overflow: hidden !important;
                position: relative !important;
                box-sizing: border-box !important;
                display: block !important;
              }
              
              /* Hide preview elements */
              .no-print, .preview-container {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                opacity: 0 !important;
              }
              
              /* Main label container - EXACT MM SIZE */
              .label {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100mm !important;
                height: 100mm !important;
                min-width: 100mm !important;
                min-height: 100mm !important;
                max-width: 100mm !important;
                max-height: 100mm !important;
                margin: 0 !important;
                padding: 2mm !important;
                border: none !important;
                background: white !important;
                box-sizing: border-box !important;
                display: block !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                page-break-after: always !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
                transform: none !important;
                zoom: 1 !important;
              }
              
              /* Header section - MM units */
              .header {
                width: 100% !important;
                height: 8mm !important;
                font-size: 10pt !important;
                font-weight: bold !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                margin-bottom: 1mm !important;
                border-bottom: 0.5pt solid black !important;
                padding-bottom: 0.5mm !important;
                box-sizing: border-box !important;
              }
              
              /* ID Display - MM units */
              .id-display {
                width: 100% !important;
                text-align: center !important;
                font-family: "Courier New", monospace !important;
                font-size: 12pt !important;
                font-weight: bold !important;
                margin: 2mm 0 !important;
                padding: 1mm !important;
                border: 1pt dashed black !important;
                background: #f8f9fa !important;
                box-sizing: border-box !important;
              }
              
              /* Main content area - MM Grid layout */
              .main-content {
                width: 100% !important;
                height: 70mm !important;
                display: grid !important;
                grid-template-columns: 45mm 45mm !important;
                gap: 2mm !important;
                margin: 1mm 0 !important;
                box-sizing: border-box !important;
              }
              
              /* QR Code section - MM units */
              .qr-section {
                width: 45mm !important;
                height: 45mm !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
              }
              
              .qr-code {
                width: 42mm !important;
                height: 42mm !important;
                display: block !important;
                box-sizing: border-box !important;
              }
              
              .qr-code img {
                width: 42mm !important;
                height: 42mm !important;
                max-width: 42mm !important;
                max-height: 42mm !important;
                min-width: 42mm !important;
                min-height: 42mm !important;
                object-fit: contain !important;
                border: 0.5pt solid black !important;
                box-sizing: border-box !important;
                display: block !important;
              }
              
              /* Info section - MM units */
              .info-section {
                width: 45mm !important;
                height: 45mm !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                box-sizing: border-box !important;
              }
              
              .specs {
                font-size: 9pt !important;
                font-weight: bold !important;
                text-align: center !important;
                margin-bottom: 2mm !important;
                padding: 1mm !important;
                background: #f0f8ff !important;
                border: 0.5pt solid black !important;
                box-sizing: border-box !important;
              }
              
              .info {
                font-size: 7pt !important;
                line-height: 1.2 !important;
                box-sizing: border-box !important;
              }
              
              .info-row {
                display: flex !important;
                justify-content: space-between !important;
                margin-bottom: 0.5mm !important;
                padding: 0.2mm 0 !important;
                box-sizing: border-box !important;
              }
              
              .info-label {
                font-weight: bold !important;
                font-size: 7pt !important;
              }
              
              .info-value {
                font-weight: normal !important;
                font-size: 7pt !important;
                text-align: right !important;
              }
              
              /* Footer - MM units */
              .footer {
                width: 100% !important;
                height: 10mm !important;
                margin-top: 1mm !important;
                padding: 1mm !important;
                background: #e3f2fd !important;
                border: 0.5pt solid black !important;
                text-align: center !important;
                font-size: 6pt !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                box-sizing: border-box !important;
              }
              
              .footer-text {
                font-size: 6pt !important;
                font-weight: bold !important;
                color: black !important;
              }
              
              .footer-subtext {
                font-size: 5pt !important;
                color: black !important;
                margin-top: 0.5mm !important;
              }
              
              /* Force all text to black */
              * {
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            
            /* Preview Container */
            .preview-container {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
            }
            
            /* Screen Preview Styles - Zebra ZD220 Compatible */
            @media screen {
              .label {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border: 2px solid #333;
                border-radius: 2px;
                background: white;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: visible;
                margin: 10px auto;
              }
              
              /* Preview için boyutları daha esnek tut */
              .label * {
                max-width: 100%;
                overflow: visible;
              }
              
              .qr-code img {
                max-width: 100%;
                height: auto;
                object-fit: contain;
              }
              
              /* Preview'da content overflow'a izin ver */
              .header, .main-content, .footer {
                overflow: visible;
              }
            }
            
            /* Print Preview Compatibility */
            @media screen and (min-resolution: 150dpi) {
              .label {
                border: 1px solid #999;
                transform: scale(0.8);
                transform-origin: center;
              }
            }
            .label {
              width: 10cm;
              height: 10cm;
              border: 2px solid #333;
              padding: 2.5mm;
              margin: 0;
              background: white;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              page-break-after: always;
              position: relative;
              overflow: hidden;
              border-radius: 2px;
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
          <div class="preview-container no-print">
            <div style="text-align: center; margin-bottom: 10px;">
              <h3 style="margin: 0; color: #333;">Zebra ZD220 - QR Kod Etiketi Önizleme</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;">100mm x 100mm etiket boyutu</p>
            </div>
            
            <button class="print-button" onclick="window.print()" style="margin-bottom: 15px;">
              🖨️ Zebra ZD220'ye Yazdır
            </button>
            
            <div style="border: 2px dashed #ccc; padding: 10px; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #888; text-align: center;">
                ↓ Bu alan tam 100mm x 100mm boyutunda yazdırılacak ↓
              </p>
            </div>
          </div>
          
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
              
              <div class="qr-section">
                <div class="qr-code">
                  <img src="${qrCodeDataURL}" alt="QR Kod: ${data.id}">
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
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="print-color-adjust" content="exact">
          <meta name="color-scheme" content="light">
          <title>Bobin QR Kod Etiketleri - ${data.parentId}</title>
          <style>
            /* ZEBRA ZD220 COIL LABELS - PIXEL PERFECT 203DPI */
            @media print {
              @page {
                size: 803px 803px !important;  /* Pixel-perfect for 203dpi */
                margin: 0px !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              html, body {
                margin: 0px !important;
                padding: 0px !important;
                width: 803px !important;
                height: 803px !important;
                font-size: 12px !important;
                background: white !important;
                overflow: hidden !important;
              }
              
              .no-print, .preview-container {
                display: none !important;
                visibility: hidden !important;
                width: 0px !important;
                height: 0px !important;
                position: absolute !important;
                left: -9999px !important;
              }
              
              .label {
                position: absolute !important;
                top: 0px !important;
                left: 0px !important;
                width: 803px !important;
                height: 803px !important;
                margin: 0px !important;
                padding: 20px !important;
                border: none !important;
                background: white !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                overflow: visible !important;
              }
              
              .header {
                width: 100% !important;
                height: 50px !important;
                font-size: 12px !important;
                margin-bottom: 10px !important;
                border-bottom: 2px solid black !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
              }
              
              .coil-number {
                width: 100% !important;
                height: 60px !important;
                font-size: 16px !important;
                font-weight: bold !important;
                text-align: center !important;
                background: #007bff !important;
                color: white !important;
                margin-bottom: 10px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 4px !important;
              }
              
              .id-display {
                width: 100% !important;
                text-align: center !important;
                font-family: monospace !important;
                font-size: 16px !important;
                font-weight: bold !important;
                margin: 10px 0 !important;
                padding: 8px !important;
                border: 2px dashed black !important;
                background: #f8f9fa !important;
                box-sizing: border-box !important;
              }
              
              .qr-section {
                width: 100% !important;
                height: 450px !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                margin: 15px 0 !important;
              }
              
              .qr-code {
                width: 420px !important;  /* Large QR for coil labels */
                height: 420px !important;
              }
              
              .qr-code img {
                width: 420px !important;
                height: 420px !important;
                object-fit: contain !important;
                border: 2px solid black !important;
                image-rendering: -webkit-optimize-contrast !important;
                image-rendering: crisp-edges !important;
              }
              
              .specs {
                width: 100% !important;
                font-size: 14px !important;
                font-weight: bold !important;
                text-align: center !important;
                margin: 10px 0 !important;
                padding: 8px !important;
                background: #f0f8ff !important;
                border: 2px solid black !important;
                box-sizing: border-box !important;
              }
              
              .info {
                width: 100% !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                margin: 10px 0 !important;
              }
              
              .info-row {
                display: flex !important;
                justify-content: space-between !important;
                margin-bottom: 6px !important;
                padding: 2px 0 !important;
              }
              
              .info-label {
                font-weight: bold !important;
                font-size: 11px !important;
                color: black !important;
              }
              
              .info-value {
                font-size: 11px !important;
                text-align: right !important;
                color: black !important;
                max-width: 300px !important;
                word-wrap: break-word !important;
              }
              
              .footer {
                width: 100% !important;
                height: 60px !important;
                margin-top: 15px !important;
                padding: 8px !important;
                background: #e3f2fd !important;
                border: 2px solid black !important;
                text-align: center !important;
                font-size: 10px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-sizing: border-box !important;
              }
              
              .footer-text {
                font-size: 10px !important;
                font-weight: bold !important;
                color: black !important;
              }
              
              /* Force all colors to black for print */
              * {
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              /* Coil number text should remain white on blue background */
              .coil-number, .coil-number * {
                color: white !important;
              }
              
              /* High contrast optimizations */
              .label * {
                text-rendering: optimizeLegibility !important;
                -webkit-font-smoothing: antialiased !important;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              flex-direction: column;
              gap: 20px;
            }
            
            /* Preview Container for Coils */
            .preview-container {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              text-align: center;
              margin-bottom: 20px;
              width: 100%;
              box-sizing: border-box;
            }
            
            /* Screen Preview Styles for Coils */
            @media screen {
              .label {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border: 1px solid #ddd;
                margin-bottom: 20px;
              }
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
          <div class="preview-container no-print">
            <div style="text-align: center; margin-bottom: 15px;">
              <h3 style="margin: 0; color: #333;">Zebra ZD220 - Bobin QR Etiketleri Önizleme</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;">${data.coilCount} adet × 100mm x 100mm etiket</p>
            </div>
            
            <button class="print-button" onclick="window.print()" style="margin-bottom: 15px;">
              🖨️ ${data.coilCount} Adet Bobin Etiketi Zebra ZD220'ye Yazdır
            </button>
            
            <div style="border: 2px dashed #ccc; padding: 10px; border-radius: 4px; background: #f9f9f9;">
              <p style="margin: 0; font-size: 12px; color: #888; text-align: center;">
                ↓ Her etiket ayrı sayfa olarak 100mm x 100mm boyutunda yazdırılacak ↓
              </p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #666; text-align: center;">
                Zebra ZD220 yazıcınızda her etiket için ayrı kağıt kullanılacak
              </p>
            </div>
          </div>
     `

    // Generate a label for each coil
    for (let i = 0; i < data.coilCount; i++) {
      const coilId = this.generateCoilQRCode(data.parentId, i)
      
      // Güvenli specifications parsing
      let cm = 0;
      let mikron = 0;
      
      try {
        if (data.specifications) {
          const specs = data.specifications.toLowerCase();
          
          // "100cm x 25μ" formatı
          const cmMatch = specs.match(/(\d+)\s*cm/);
          if (cmMatch) {
            cm = parseInt(cmMatch[1]) || 0;
          }
          
          // "x 25μ" veya "x 25mikron" formatı
          const mikronMatch = specs.match(/x\s*(\d+)(?:\s*[μµ]|mikron)/);
          if (mikronMatch) {
            mikron = parseInt(mikronMatch[1]) || 0;
          }
        }
      } catch (error) {
        console.warn('Coil specifications parsing error:', error);
        cm = 0;
        mikron = 0;
      }
      
      const coilQRData = this.generateQRData({
        id: coilId,
        material: data.material,
        cm: cm,
        mikron: mikron,
        weight: weightPerCoil,
        supplier: data.supplier,
        date: data.date,
        customer: data.customer,
        stockType: data.stockType,
        location: data.location,
        bobinCount: 1
      })

      let qrCodeDataURL;
      try {
        qrCodeDataURL = await this.generateDataURL(coilQRData, {
          width: 1200,  // High resolution for crisp print
          margin: 4,    // Better margin for scanning
          errorCorrectionLevel: 'H'  // Maximum error correction
        })
      } catch (error) {
        console.error(`Coil ${i + 1} QR code generation failed:`, error);
        // Fallback: basit QR kod oluştur
        try {
          qrCodeDataURL = await this.generateDataURL(coilId, {
            width: 200,
            margin: 2
          })
        } catch (fallbackError) {
          console.error(`Coil ${i + 1} fallback QR code generation failed:`, fallbackError);
          throw new Error(`Bobin ${i + 1} QR kod oluşturulamadı`);
        }
      }

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
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="print-color-adjust" content="exact">
          <meta name="color-scheme" content="light">
          <title>Dönüş QR Kod Etiketleri - ${data.parentQRCode}</title>
          <style>
            /* ZEBRA ZD220 RETURN LABELS - AGGRESSIVE OPTIMIZATION */
            @media print {
              @page {
                size: 4in 4in;
                margin: 0 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 4in !important;
                height: 4in !important;
                font-size: 16px !important;
                background: white !important;
                overflow: hidden !important;
              }
              
              .no-print, .preview-container {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
              }
              
              .label {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 4in !important;
                height: 4in !important;
                margin: 0 !important;
                padding: 0.1in !important;
                border: none !important;
                background: white !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                overflow: visible !important;
              }
              
              .header {
                width: 100% !important;
                height: 0.25in !important;
                font-size: 10pt !important;
                margin-bottom: 0.05in !important;
                border-bottom: 1px solid #ff6b35 !important;
              }
              
              .return-badge {
                width: 100% !important;
                height: 0.3in !important;
                font-size: 12pt !important;
                font-weight: bold !important;
                text-align: center !important;
                background: #ff6b35 !important;
                color: white !important;
                margin-bottom: 0.05in !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              
              .id-display {
                width: 100% !important;
                text-align: center !important;
                font-family: monospace !important;
                font-size: 12pt !important;
                font-weight: bold !important;
                margin: 0.05in 0 !important;
                padding: 0.03in !important;
                border: 1px dashed #ff6b35 !important;
                background: #fff5f0 !important;
              }
              
              .main-content {
                width: 100% !important;
                height: 2.5in !important;
                display: grid !important;
                grid-template-columns: 1.8in 1.8in !important;
                gap: 0.1in !important;
                margin: 0.05in 0 !important;
              }
              
              .qr-section {
                width: 1.8in !important;
                height: 1.8in !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              
              .qr-code {
                width: 1.6in !important;
                height: 1.6in !important;
              }
              
              .qr-code img {
                width: 1.6in !important;
                height: 1.6in !important;
                object-fit: contain !important;
                border: 1px solid black !important;
              }
              
              .info-section {
                width: 1.8in !important;
                height: 1.8in !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
              }
              
              .specs {
                width: 100% !important;
                font-size: 10pt !important;
                font-weight: bold !important;
                text-align: center !important;
                margin-bottom: 0.05in !important;
                padding: 0.03in !important;
                background: #fff5f0 !important;
                border: 1px solid #ff6b35 !important;
              }
              
              .condition {
                width: 100% !important;
                font-size: 9pt !important;
                font-weight: bold !important;
                text-align: center !important;
                margin-bottom: 0.05in !important;
                padding: 0.03in !important;
                border-radius: 3px !important;
              }
              
              .condition.kullanilabilir {
                background: #d4edda !important;
                color: #155724 !important;
                border: 1px solid #c3e6cb !important;
              }
              
              .condition.hasarli {
                background: #f8d7da !important;
                color: #721c24 !important;
                border: 1px solid #f5c6cb !important;
              }
              
              .condition.kontrol-gerekli {
                background: #fff3cd !important;
                color: #856404 !important;
                border: 1px solid #ffeaa7 !important;
              }
              
              .info {
                width: 100% !important;
                font-size: 8pt !important;
                line-height: 1.2 !important;
                flex: 1 !important;
              }
              
              .info-row {
                display: flex !important;
                justify-content: space-between !important;
                margin-bottom: 0.02in !important;
              }
              
              .info-label {
                font-weight: bold !important;
                font-size: 8pt !important;
              }
              
              .info-value {
                font-size: 8pt !important;
                text-align: right !important;
              }
              
              .footer {
                width: 100% !important;
                height: 0.3in !important;
                margin-top: 0.05in !important;
                padding: 0.02in !important;
                background: #fff5f0 !important;
                border: 1px solid #ff6b35 !important;
                text-align: center !important;
                font-size: 7pt !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              
              .footer-text {
                color: #ff6b35 !important;
                font-weight: bold !important;
              }
              
              * {
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              /* Return-specific color overrides */
              .company-text, .header-text {
                color: #ff6b35 !important;
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
          <div class="preview-container no-print">
            <div style="text-align: center; margin-bottom: 15px;">
              <h3 style="margin: 0; color: #ff6b35;">Zebra ZD220 - Dönüş QR Etiketleri Önizleme</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;">${data.returnQRCodes.length} adet × 100mm x 100mm dönüş etiketi</p>
            </div>
            
            <button class="print-button" onclick="window.print()" style="margin-bottom: 15px; background: #ff6b35;">
              🖨️ ${data.returnQRCodes.length} Adet Dönüş Etiketi Zebra ZD220'ye Yazdır
            </button>
            
            <div style="border: 2px dashed #ff6b35; padding: 10px; border-radius: 4px; background: #fff5f0;">
              <p style="margin: 0; font-size: 12px; color: #ff6b35; text-align: center;">
                ↓ Her dönüş etiketi ayrı sayfa olarak 100mm x 100mm boyutunda yazdırılacak ↓
              </p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #666; text-align: center;">
                Dönüş ürünleri için özel turuncu renk kodlaması
              </p>
            </div>
          </div>
     `

    // Generate a label for each return QR code
    for (const returnQR of data.returnQRCodes) {
      // Güvenli specifications parsing
      let cm = 0;
      let mikron = 0;
      let material = 'OPP';
      
      try {
        if (data.specifications) {
          const specs = data.specifications.toLowerCase();
          
          // Material extraction - ilk split ile dene, yoksa default
          const parts = data.specifications.split(' • ');
          if (parts.length >= 3) {
            material = parts[2] || 'OPP';
          }
          
          // "100cm x 25μ" formatı
          const cmMatch = specs.match(/(\d+)\s*cm/);
          if (cmMatch) {
            cm = parseInt(cmMatch[1]) || 0;
          }
          
          // "x 25μ" veya "x 25mikron" formatı
          const mikronMatch = specs.match(/x\s*(\d+)(?:\s*[μµ]|mikron)/);
          if (mikronMatch) {
            mikron = parseInt(mikronMatch[1]) || 0;
          }
        }
      } catch (error) {
        console.warn('Return specifications parsing error:', error);
        cm = 0;
        mikron = 0;
        material = 'OPP';
      }
      
      const returnQRData = this.generateQRData({
        id: returnQR.qrCode,
        material: material,
        cm: cm,
        mikron: mikron,
        weight: returnQR.weight,
        supplier: data.supplier,
        date: returnQR.date,
        customer: data.customer,
        stockType: 'general',
        location: 'Depo',
        bobinCount: 1
      })

      let qrCodeDataURL;
      try {
        qrCodeDataURL = await this.generateDataURL(returnQRData, {
          width: 200,
          margin: 2
        })
      } catch (error) {
        console.error(`Return QR code generation failed for ${returnQR.qrCode}:`, error);
        // Fallback: basit QR kod oluştur
        try {
          qrCodeDataURL = await this.generateDataURL(returnQR.qrCode, {
            width: 200,
            margin: 2
          })
        } catch (fallbackError) {
          console.error(`Return fallback QR code generation failed for ${returnQR.qrCode}:`, fallbackError);
          throw new Error(`Dönüş QR kod oluşturulamadı: ${returnQR.qrCode}`);
        }
      }

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
