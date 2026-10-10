import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Gurmukhi } from "next/font/google";
import "@/styles/tokens.css";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const notoSans = Noto_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-gurmukhi",
  subsets: ["gurmukhi"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Farm Assistant: Farming Advice in Your Language",
  description:
    "Ask farming questions in Hindi, Punjabi, or English. Get crop advice, weather forecasts, mandi prices, and disease identification based on real data.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Farm Assistant: Farming Advice in Your Language",
    description:
      "Ask farming questions in your language. Get crop advice, weather, mandi prices, and disease identification.",
    type: "website",
    locale: "en_IN",
    siteName: "Farm Assistant",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Farm Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farm Assistant: Farming Advice in Your Language",
    description:
      "Ask farming questions in your language. Get crop advice, weather, mandi prices, and disease identification.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a3a2a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoDevanagari.variable} ${notoGurmukhi.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily:
            "var(--font-latin), var(--font-devanagari), var(--font-gurmukhi), system-ui, sans-serif",
          backgroundColor: "var(--color-bg-page)",
          color: "var(--color-text-primary)",
          fontSize: "var(--text-base)",
          lineHeight: "var(--line-height-normal)",
        }}
      >
        <I18nProvider>
          {/* Skip-to-content accessibility link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:font-semibold focus:rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            style={{
              backgroundColor: "var(--color-green-900)",
              color: "var(--color-white)",
            }}
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
