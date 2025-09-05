import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { zplData, title = 'Etiket Yazdırma' } = await request.json()

    if (!zplData) {
      return NextResponse.json(
        { error: 'ZPL data is required' },
        { status: 400 }
      )
    }

    const printerId = process.env.PRINTNODE_PRINTER_ID
    const apiKey = process.env.PRINTNODE_API_KEY

    if (!printerId || !apiKey) {
      return NextResponse.json(
        { error: 'PrintNode configuration missing' },
        { status: 500 }
      )
    }

    // PrintNode API'ye yazdırma isteği gönder
    const response = await axios.post(
      'https://api.printnode.com/printjobs',
      {
        printerId: parseInt(printerId),
        title: title,
        contentType: 'raw_base64',
        content: Buffer.from(zplData).toString('base64'),
        source: 'DEKA Order Tracker',
        options: {
          // Zebra ZD220 için optimize edilmiş ayarlar
          copies: 1,
          dpi: '203',
          rotate: 0,
          paperSize: '4x4' // 10x10cm için
        }
      },
      {
        auth: {
          username: apiKey,
          password: ''
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('PrintNode response:', response.data)

    return NextResponse.json({
      success: true,
      jobId: response.data.id,
      message: 'Yazdırma işi başarıyla gönderildi',
      data: response.data
    })

  } catch (error) {
    console.error('PrintNode API error:', error)
    
    let errorMessage = 'Yazdırma hatası oluştu'
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        errorMessage = `PrintNode API hatası: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'PrintNode API\'ye bağlanılamadı'
      } else {
        errorMessage = `İstek hatası: ${error.message}`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: axios.isAxiosError(error) ? error.response?.data : null
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'PrintNode API endpoint is working',
    config: {
      printerId: process.env.PRINTNODE_PRINTER_ID,
      hasApiKey: !!process.env.PRINTNODE_API_KEY
    }
  })
}
