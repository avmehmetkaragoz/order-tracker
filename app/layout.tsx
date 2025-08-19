import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstall } from "@/components/pwa-install"
import { OfflineIndicator } from "@/components/offline-indicator"
import { PWAProvider } from "@/components/pwa-provider"
import { HeaderNav } from "@/components/header-nav"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sipariş Takip - Tedarikçi Sipariş Yönetimi",
  description: "Tedarikçi siparişlerini takip etmek için mobil uygulama. Offline çalışır, hızlı ve pratik.",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sipariş Takip",
  },
  keywords: ["sipariş", "takip", "tedarikçi", "yönetim", "mobil", "offline", "PWA"],
  authors: [{ name: "v0.app" }],
  creator: "v0.app",
  publisher: "v0.app",
  robots: "index, follow",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sipariş Takip" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/images/company-logo.png" />
        <link rel="icon" type="image/png" href="/images/company-logo.png" />
        <link rel="icon" type="image/svg+xml" href="/images/company-logo.svg" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PWAProvider>
            <HeaderNav />
            {children}
            <Toaster />
            <PWAInstall />
            <OfflineIndicator />
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
