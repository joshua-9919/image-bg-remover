import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-D659NXZZB3";

export const metadata: Metadata = {
  metadataBase: new URL("https://image-bg-remove.shop"),
  title: {
    default: "Image BG Remover - Free AI Background Remover",
    template: "%s | Image BG Remover",
  },
  description: "Remove image backgrounds automatically in seconds. Try 3 guest removals, then sign in for a 3-day free trial and API access.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://image-bg-remove.shop/",
    siteName: "Image BG Remover",
    title: "Image BG Remover - Free AI Background Remover",
    description: "Remove image backgrounds automatically in seconds. Download transparent PNG files for product photos, ecommerce, and API workflows.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Image BG Remover preview",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image BG Remover - Free AI Background Remover",
    description: "Remove image backgrounds automatically in seconds and download transparent PNG files.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
