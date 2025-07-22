// sports-disscussing-field/src/app/metadata.ts
import type { Metadata } from "next";

// Define metadata for the entire application, pulled from your original index.html
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
    apple: "/lovable-uploads/d27f0c5d-529f-45bd-9e66-45b3a46ab1a6.png?v=2", // Default Apple Touch Icon
  },
  manifest: "/manifest.json", // Web App Manifest
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
