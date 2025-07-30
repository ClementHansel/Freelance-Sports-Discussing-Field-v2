// sports-disscussing-field/src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title:
    "Minor Hockey Talks - The Premier Community for Minor Hockey Discussion",
  description:
    "Join the leading online community for minor hockey players, parents, and coaches. Discuss teams, share experiences, get advice, and connect with hockey families across all levels and regions.",
  keywords: [
    "minor hockey",
    "youth hockey",
    "hockey community",
    "hockey discussion",
    "hockey parents",
    "hockey coaching",
    "hockey teams",
  ],
  authors: [{ name: "Minor Hockey Talks" }],
  icons: {
    icon: [
      {
        url: "/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2",
        sizes: "any",
        type: "image/png",
      },
      {
        url: "/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2",
  },
  manifest: "/manifest.json",
  openGraph: {
    title:
      "Minor Hockey Talks - The Premier Community for Minor Hockey Discussion",
    description:
      "Join the leading online community for minor hockey players, parents, and coaches. Discuss teams, share experiences, get advice, and connect with hockey families.",
    type: "website",
    images: ["/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2"],
    siteName: "Minor Hockey Talks",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minor Hockey Talks - Premier Minor Hockey Community",
    description:
      "Join the leading online community for minor hockey players, parents, and coaches.",
    images: ["/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Google Analytics Script - ONLY load the gtag.js script here */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-RFQVZPVL0N"
        />
        {/* The gtag initialization will now happen in useGoogleAnalytics hook */}

        {/* Google AdSense Script */}
        <Script
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5447109336224364"
          crossOrigin="anonymous"
        />

        {/* Error Boundary wraps all providers and content */}
        <ErrorBoundary>
          <Providers>
            <Suspense
              fallback={
                <Card className="p-6">
                  <div className="text-center">Loading content...</div>
                </Card>
              }
            >
              {children}
            </Suspense>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
