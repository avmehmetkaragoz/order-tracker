// Simple barcode generation utility for Code 128 format
export class BarcodeGenerator {
  // Code 128 character set
  private static readonly CODE128_CHARS = [
    " ",
    "!",
    '"',
    "#",
    "$",
    "%",
    "&",
    "'",
    "(",
    ")",
    "*",
    "+",
    ",",
    "-",
    ".",
    "/",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ":",
    ";",
    "<",
    "=",
    ">",
    "?",
    "@",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "[",
    "\\",
    "]",
    "^",
    "_",
  ]

  // Generate SVG barcode
  static generateSVG(
    text: string,
    options: {
      width?: number
      height?: number
      fontSize?: number
      showText?: boolean
    } = {},
  ): string {
    const { width = 200, height = 60, fontSize = 12, showText = true } = options

    const barWidth = width / (text.length * 11 + 35) // Approximate bar width
    let currentX = 10
    let bars = ""

    // Start pattern
    bars += this.createBar(currentX, barWidth * 3, height - (showText ? fontSize + 5 : 5))
    currentX += barWidth * 3
    bars += this.createBar(currentX, barWidth, height - (showText ? fontSize + 5 : 5))
    currentX += barWidth * 2
    bars += this.createBar(currentX, barWidth, height - (showText ? fontSize + 5 : 5))
    currentX += barWidth * 2

    // Data bars (simplified pattern)
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const charIndex = this.CODE128_CHARS.indexOf(char)

      // Create alternating pattern based on character
      const pattern = this.getCharPattern(charIndex)
      for (let j = 0; j < pattern.length; j++) {
        if (pattern[j] === "1") {
          bars += this.createBar(currentX, barWidth, height - (showText ? fontSize + 5 : 5))
        }
        currentX += barWidth
      }
    }

    // End pattern
    bars += this.createBar(currentX, barWidth, height - (showText ? fontSize + 5 : 5))
    currentX += barWidth * 2
    bars += this.createBar(currentX, barWidth * 3, height - (showText ? fontSize + 5 : 5))

    const textElement = showText
      ? `<text x="${width / 2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="black">${text}</text>`
      : ""

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white"/>
        ${bars}
        ${textElement}
      </svg>
    `
  }

  private static createBar(x: number, width: number, height: number): string {
    return `<rect x="${x}" y="5" width="${width}" height="${height}" fill="black"/>`
  }

  private static getCharPattern(charIndex: number): string {
    // Simplified pattern generation - in real implementation, use proper Code 128 patterns
    const patterns = [
      "11011001100",
      "11001101100",
      "11001100110",
      "10010011000",
      "10010001100",
      "10001001100",
      "10011001000",
      "10011000100",
      "10001100100",
      "11001001000",
    ]
    return patterns[charIndex % patterns.length] || "11011001100"
  }

  // Generate data URL for printing
  static generateDataURL(
    text: string,
    options?: {
      width?: number
      height?: number
      fontSize?: number
      showText?: boolean
    },
  ): string {
    const svg = this.generateSVG(text, options)
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  // Generate printable label HTML
  static generatePrintableLabel(data: {
    barcode: string
    title: string
    specifications: string
    weight: number
    supplier: string
    date: string
  }): string {
    const barcodeDataURL = this.generateDataURL(data.barcode, {
      width: 250,
      height: 80,
      fontSize: 10,
      showText: true,
    })

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barkod Etiketi - ${data.barcode}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .label {
              width: 300px;
              border: 2px solid #000;
              padding: 15px;
              margin: 10px auto;
              background: white;
              page-break-after: always;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            .company-logo {
              height: 20px;
              width: auto;
              max-width: 60px;
            }
            .barcode {
              text-align: center;
              margin: 15px 0;
            }
            .barcode img {
              max-width: 100%;
              height: auto;
            }
            .info {
              font-size: 12px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .specs {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
              padding: 5px;
              background: #f5f5f5;
              border-radius: 4px;
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
          <button class="print-button no-print" onclick="window.print()">🖨️ Yazdır</button>
          
          <div class="label">
            <div class="header">
              <img src="${window.location.origin}/images/company-logo.png" alt="DEKA" class="company-logo" onerror="console.log('Logo yüklenemedi:', this.src); this.style.display='none'">
              DEPO ETİKETİ
            </div>
            
            <div class="barcode">
              <img src="${barcodeDataURL}" alt="Barkod: ${data.barcode}">
            </div>
            
            <div class="specs">${data.specifications}</div>
            
            <div class="info">
              <div class="info-row">
                <span class="info-label">Ağırlık:</span>
                <span>${data.weight} kg</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tedarikçi:</span>
                <span>${data.supplier}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tarih:</span>
                <span>${data.date}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Barkod:</span>
                <span style="font-family: monospace;">${data.barcode}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  static generateCoilBarcode(parentBarcode: string, coilIndex: number): string {
    // Generate unique barcode for each coil: parentBarcode + coil number
    return `${parentBarcode}-C${String(coilIndex + 1).padStart(2, "0")}`
  }

  static generateMultipleCoilLabels(data: {
    parentBarcode: string
    title: string
    specifications: string
    totalWeight: number
    coilCount: number
    supplier: string
    date: string
  }): string {
    const weightPerCoil = Math.round((data.totalWeight / data.coilCount) * 100) / 100
    let labelsHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bobin Barkod Etiketleri - ${data.parentBarcode}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .label {
              width: 300px;
              border: 2px solid #000;
              padding: 15px;
              margin: 10px auto;
              background: white;
              page-break-after: always;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 10px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            .company-logo {
              height: 20px;
              width: auto;
              max-width: 60px;
            }
            .barcode {
              text-align: center;
              margin: 15px 0;
            }
            .barcode img {
              max-width: 100%;
              height: auto;
            }
            .info {
              font-size: 12px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .specs {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
              padding: 5px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .coil-number {
              background: #007bff;
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 10px;
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
          <button class="print-button no-print" onclick="window.print()">🖨️ Tüm Bobin Etiketlerini Yazdır</button>
    `

    // Generate a label for each coil
    for (let i = 0; i < data.coilCount; i++) {
      const coilBarcode = this.generateCoilBarcode(data.parentBarcode, i)
      const barcodeDataURL = this.generateDataURL(coilBarcode, {
        width: 250,
        height: 80,
        fontSize: 10,
        showText: true,
      })

      labelsHTML += `
        <div class="label">
          <div class="header">
            <img src="${window.location.origin}/images/company-logo.png" alt="DEKA" class="company-logo" onerror="console.log('Logo yüklenemedi:', this.src); this.style.display='none'">
            BOBİN ETİKETİ
          </div>
          <div class="coil-number">BOBİN ${i + 1} / ${data.coilCount}</div>
          
          <div class="barcode">
            <img src="${barcodeDataURL}" alt="Barkod: ${coilBarcode}">
          </div>
          
          <div class="specs">${data.specifications}</div>
          
          <div class="info">
            <div class="info-row">
              <span class="info-label">Tahmini Ağırlık:</span>
              <span>${weightPerCoil} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tedarikçi:</span>
              <span>${data.supplier}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tarih:</span>
              <span>${data.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Barkod:</span>
              <span style="font-family: monospace;">${coilBarcode}</span>
            </div>
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
}
