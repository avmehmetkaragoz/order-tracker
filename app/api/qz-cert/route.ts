import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // QZ Tray için geliştirme sertifikası
    // Production'da gerçek sertifika kullanılmalı
    const certificate = process.env.QZ_CERTIFICATE;
    
    if (!certificate) {
      // Geliştirme modu için dummy sertifika
      console.warn('⚠️ QZ_CERTIFICATE not configured - using insecure development mode');
      
      const devCertificate = `-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwGe8qVqm2HZsADk0
Z6OPgD2QO0oP1PvGHFmXCaEbNKm+PmFj1nFc8WF+i2YmG8SgY7qZeZVJPn9r
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
-----END CERTIFICATE-----`;
      
      return NextResponse.json(devCertificate, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    return NextResponse.json(certificate, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('QZ certificate error:', error);
    return NextResponse.json(
      { error: 'Failed to get certificate' },
      { status: 500 }
    );
  }
}
