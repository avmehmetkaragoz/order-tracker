import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs'; // Node.js runtime for crypto operations

export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Missing data to sign' }, { status: 400 });
    }

    // Get private key from environment
    const privateKeyPem = process.env.QZ_PRIVATE_KEY;
    
    // Geliştirme modu: Private key yoksa insecure mode kullan
    if (!privateKeyPem) {
      console.warn('⚠️ QZ_PRIVATE_KEY not configured - using insecure development mode');
      
      // Geliştirme için basit bir "signature" döndür
      const devSignature = Buffer.from(`dev-signature-${Date.now()}-${data.slice(0, 10)}`).toString('base64');
      
      return NextResponse.json({ 
        signature: devSignature,
        warning: 'Development mode - insecure signature used',
        note: 'Set QZ_PRIVATE_KEY environment variable for production'
      });
    }

    // Production mode: Gerçek signature
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();

    const signature = sign.sign(privateKeyPem, 'base64');

    return NextResponse.json({ signature });
  } catch (error) {
    console.error('QZ signing error:', error);
    return NextResponse.json({
      error: 'Failed to sign data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
