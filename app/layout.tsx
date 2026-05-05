import type { Metadata } from "next"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { Navbar } from "@/components/navbar"
import { Providers } from "@/components/providers"
import Script from "next/script"

export const metadata: Metadata = {
  title: "LybyTex — Fabric Catalog",
  description: "Browse and order African fabrics from LybyTex India",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet" />
        <style>{`
          .goog-te-banner-frame, .skiptranslate { display: none !important; }
          body { top: 0 !important; }
          .goog-te-gadget { font-size: 0 !important; }
          .goog-te-gadget select { 
            font-family: 'DM Sans', sans-serif !important;
            font-size: 14px !important;
            border: 1.5px solid #E8E0D5 !important;
            border-radius: 8px !important;
            padding: 8px 12px !important;
            background: white !important;
            color: #1A1208 !important;
            cursor: pointer !important;
            outline: none !important;
          }
        `}</style>
      </head>
      <body style={{ background: "#FDFAF6", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        <div id="google_translate_element" style={{ display: "none" }} />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">{`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'fr,sw,ha,yo,ig',
              layout: google.translate.TranslateElement.InlineLayout.SIMPLE
            }, 'google_translate_element');
          }
        `}</Script>
        <Providers>
          <CartProvider>
            <Navbar />
            <main>{children}</main>
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}