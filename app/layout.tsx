import type { Metadata } from "next";
import CookieConsent from "../components/CookieConsent";
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
  // One inline script, not next/script and not a bare <script src>.
  // next/script afterInteractive in a manual <head> only emitted a preload, so
  // GA4 never received hits. A bare <script src> is hoisted into <head> and can
  // run before the Consent Mode default. Injecting gtag.js after the default is
  // set keeps the required order in the static HTML.
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
try {
  if (localStorage.getItem('ibr_cookie_consent') === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch (e) {}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
(function(){
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}';
  document.head.appendChild(s);
})();
            `.trim(),
          }}
        />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
