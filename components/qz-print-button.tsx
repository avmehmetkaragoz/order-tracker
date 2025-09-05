"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { printWithQz } from '@/lib/qz-connection';

// QZ Tray npm paketini import et
declare global {
  interface Window {
    qz: any;
  }
}

interface QzPrintButtonProps {
  zplData: string;
  label?: string;
  printerName?: string; // Optional: specific printer name
  onSuccess?: () => void;
  onError?: (error: string) => void;
  insecureMode?: boolean; // Geliştirme için güvenli olmayan mod
}

export function QzPrintButton({
  zplData,
  label = 'QZ Yazdır',
  printerName,
  onSuccess,
  onError,
  insecureMode = false
}: QzPrintButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // QZ Tray'i npm paketinden yükle ve güvenlik ayarlarını yap
  const loadQz = async () => {
    if (window.qz) return window.qz;

    try {
      // Dinamik import ile QZ Tray paketini yükle
      const qzTray = await import('qz-tray');
      
      // QZ Tray'i global window'a ata
      window.qz = qzTray.default || qzTray;
      
      // Promise type'ı doğru şekilde ayarla
      window.qz.api.setPromiseType(function(resolver: any) {
        return new Promise(resolver);
      });
      
      console.log('✅ QZ Tray npm paketinden başarıyla yüklendi');
      return window.qz;
    } catch (error) {
      console.error('❌ QZ Tray npm paketi yüklenemedi:', error);
      throw new Error('QZ Tray kütüphanesi yüklenemedi. npm paketi kurulu olmayabilir.');
    }
  };

  // QZ Tray güvenlik ayarlarını başlat (tek sefer)
  let securityInitialized = false;
  const initQzSecurity = (qz: any, insecureMode: boolean) => {
    if (securityInitialized) return;
    
    if (insecureMode) {
      console.log('🔓 Insecure mode - güvenlik atlanıyor');
      qz.security.setCertificatePromise(() => Promise.resolve(''));
      qz.security.setSignaturePromise(() => Promise.resolve(''));
    } else {
      console.log('🔒 Secure mode - sertifika kullanılıyor');
      qz.security.setCertificatePromise(async () => {
        const response = await fetch('/api/qz-cert');
        return response.text();
      });
      qz.security.setSignaturePromise(signData);
    }
    
    securityInitialized = true;
  };

  const signData = async (data: string): Promise<string> => {
    const response = await fetch('/api/qz-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Signing failed');
    }

    return result.signature;
  };

  // QZ Tray bağlantısı - doğru hosts dizisi ile
  const connectQz = async (qz: any) => {
    if (qz.websocket.isActive()) {
      console.log('✅ QZ Tray zaten bağlı');
      return;
    }
    
    try {
      // Protokol uyumluluğu kontrolü
      const isSecure = window.location.protocol === 'https:';
      
      // Hosts dizisi - QZ Tray'in beklediği format
      const hosts = ['127.0.0.1', 'localhost'];
      
      console.log('🔄 QZ Tray bağlantısı başlatılıyor...');
      console.log(`📡 Protokol: ${isSecure ? 'WSS (Secure)' : 'WS (Insecure)'}`);
      console.log(`🏠 Hosts: ${hosts.join(', ')}`);
      
      await qz.websocket.connect({
        hosts: hosts, // DİZİ OLARAK VERİLMELİ
        secure: isSecure, // Protokol uyumluluğu
        // port: 8181 // varsayılan port, gerekirse belirtilebilir
      });
      
      console.log('✅ QZ Tray bağlantısı başarılı');
    } catch (error) {
      console.error('❌ QZ Tray bağlantı hatası:', error);
      throw new Error('QZ Tray uygulamasına bağlanılamadı. QZ Tray açık mı kontrol edin.');
    }
  };

  const handlePrint = async () => {
    setIsLoading(true);

    try {
      // Yeni timeout'lu ve sağlam bağlantı sistemi kullan
      await printWithQz(zplData, printerName);

      toast({
        title: "Yazdırma Başarılı",
        description: "Test etiketi başarıyla yazıcıya gönderildi (timeout korumalı).",
      });

      onSuccess?.();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error('QZ Print error:', error);

      // Timeout ve diğer hata mesajları
      let userFriendlyMessage = errorMessage;
      let solution = '';

      if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'İşlem zaman aşımına uğradı';
        solution = 'QZ Tray açık mı kontrol edin. Firewall engellemesi olabilir.';
      } else if (errorMessage.includes('QZ Tray kütüphanesi yüklenemedi')) {
        userFriendlyMessage = 'QZ Tray paketi hatası';
        solution = 'npm paketi kurulu olmayabilir.';
      } else if (errorMessage.includes('bağlanılamadı')) {
        userFriendlyMessage = 'QZ Tray uygulaması çalışmıyor';
        solution = 'Sistem tepsisinde QZ Tray simgesini kontrol edin.';
      } else if (errorMessage.includes('yazıcı bulunamadı')) {
        userFriendlyMessage = 'Yazıcı bulunamadı';
        solution = 'Yazıcı sisteme bağlı olduğundan emin olun.';
      }

      toast({
        title: "Yazdırma Hatası",
        description: solution ? `${userFriendlyMessage}. ${solution}` : userFriendlyMessage,
        variant: "destructive",
      });

      onError?.(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={isLoading}
      size="sm"
      className="w-full"
    >
      <Printer className="h-4 w-4 mr-1" />
      {isLoading ? 'Yazdırılıyor...' : label}
    </Button>
  );
}

// Helper function to generate basic ZPL for 10x10cm labels (792x792 dots at 203 DPI)
export function generateTestZPL(text: string = 'TEST LABEL'): string {
  const currentDate = new Date().toLocaleDateString('tr-TR');
  const currentTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  
  return `^XA
^CI28
^MMT
^PW792
^LL792
^LH0,0
^FO50,50^A0N,60,60^FD${text}^FS
^FO50,150^A0N,40,40^FDTarih: ${currentDate}^FS
^FO50,220^A0N,40,40^FDSaat: ${currentTime}^FS
^FO50,320^A0N,35,35^FDDEKA Plastik^FS
^FO50,380^A0N,30,30^FDSipariş Takip Sistemi^FS
^FO50,720^A0N,25,25^FDTest Etiketi - 10x10cm^FS
^XZ`;
}

// Helper function to generate QR ZPL for 10x10cm labels - VERİ SIRASI DÜZELTİLDİ
export function generateQRZPL(qrData: string, text: string = ''): string {
  const currentDate = new Date().toLocaleDateString('tr-TR');
  const currentTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const lines = text.split('\n').filter(line => line.trim());
  
  // Veri sırasını düzelt: 0=ID, 1=özellikler, 2=ağırlık, 3=tedarikçi, 4=müşteri, 5=bobin sayısı
  const productInfo = lines[0] || 'QR Kod Etiketi';
  const specifications = lines[1] || ''; // Malın özellikleri (100cm x 25μ x OPP)
  const weight = lines[2] || ''; // Ağırlık bilgisi
  const supplier = lines[3] || ''; // Tedarikçi
  const customer = lines[4] || ''; // Müşteri
  const bobinInfo = lines[5] || '1 Bobin'; // Bobin sayısı bilgisi
  
  // Bobin sayısını parse et
  let bobinSayisi = '1';
  if (bobinInfo.includes('Bobin')) {
    const match = bobinInfo.match(/(\d+)\s*Bobin/);
    if (match) {
      bobinSayisi = match[1];
    }
  }
  
  return `^XA
^CI28
^MMT
^PW792
^LL792
^LH0,0
^FO50,30^A0N,30,30^FDDEKA PLASTİK^FS
^FO50,80^A0N,20,20^FD${productInfo}^FS
^FO450,80^BQN,2,3^FDQA,${qrData}^FS
^FO50,250^GB350,3,3^FS
^FO50,270^A0N,20,20^FDÖzellikler: ${specifications}^FS
^FO50,300^A0N,20,20^FDAğırlık: ${weight}^FS
^FO50,330^A0N,20,20^FDTedarikçi: ${supplier}^FS
^FO50,360^A0N,20,20^FDMüşteri: ${customer}^FS
^FO50,390^A0N,20,20^FDStok Tipi: Genel^FS
^FO50,420^A0N,20,20^FDLokasyon: Depo^FS
^FO50,450^A0N,20,20^FDTarih: ${currentDate} ${currentTime}^FS
^FO50,480^A0N,20,20^FDBobin Sayısı: ${bobinSayisi}^FS
^FO50,520^A0N,16,16^FDTakip Sistemi - Mobil cihazla tarayın^FS
^FO50,720^A0N,14,14^FDwww.dekaplastik.com^FS
^XZ`;
}

// Helper function to generate product label ZPL for 10x10cm - DÜZELTME
export function generateProductLabelZPL(productName: string, productCode: string, qrData: string): string {
  const currentDate = new Date().toLocaleDateString('tr-TR');
  const currentTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  
  return `^XA
^CI28
^MMT
^PW792
^LL792
^LH0,0
^FO50,30^A0N,30,30^FDDEKA PLASTİK^FS
^FO50,80^A0N,20,20^FD${productName.length > 25 ? productName.substring(0, 25) + '...' : productName}^FS
^FO450,80^BQN,2,3^FDQA,${qrData}^FS
^FO50,220^GB692,3,3^FS
^FO50,240^A0N,20,20^FDKod: ${productCode}^FS
^FO50,270^A0N,20,20^FDMüşteri: -^FS
^FO50,300^A0N,20,20^FDStok Tipi: Üretim^FS
^FO50,330^A0N,20,20^FDLokasyon: Üretim Hattı^FS
^FO50,360^A0N,20,20^FDTarih: ${currentDate} ${currentTime}^FS
^FO50,390^A0N,20,20^FDBobin Sayısı: 1^FS
^FO50,430^A0N,16,16^FDÜretim Etiketi - Mobil cihazla tarayın^FS
^FO50,720^A0N,14,14^FDwww.dekaplastik.com^FS
^XZ`;
}

// Helper function to generate shipping label ZPL for 10x10cm - DÜZELTME
export function generateShippingLabelZPL(orderNumber: string, customerName: string, qrData: string): string {
  const currentDate = new Date().toLocaleDateString('tr-TR');
  const currentTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  
  return `^XA
^CI28
^MMT
^PW792
^LL792
^LH0,0
^FO50,30^A0N,30,30^FDDEKA PLASTİK^FS
^FO50,80^A0N,20,20^FDSipariş: ${orderNumber.length > 20 ? orderNumber.substring(0, 20) + '...' : orderNumber}^FS
^FO450,80^BQN,2,3^FDQA,${qrData}^FS
^FO50,220^GB692,3,3^FS
^FO50,240^A0N,20,20^FDMüşteri: ${customerName.length > 20 ? customerName.substring(0, 20) + '...' : customerName}^FS
^FO50,270^A0N,20,20^FDAğırlık: -^FS
^FO50,300^A0N,20,20^FDStok Tipi: Kargo^FS
^FO50,330^A0N,20,20^FDLokasyon: Sevkiyat^FS
^FO50,360^A0N,20,20^FDTarih: ${currentDate} ${currentTime}^FS
^FO50,390^A0N,20,20^FDBobin Sayısı: -^FS
^FO50,430^A0N,16,16^FDKargo Etiketi - Mobil cihazla tarayın^FS
^FO50,720^A0N,14,14^FDwww.dekaplastik.com^FS
^XZ`;
}
