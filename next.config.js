import path from "path";
import { fileURLToPath } from "url"; // Import fileURLToPath from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This configuration is suitable for a Next.js application leveraging SSR/API routes,
  // which is common when integrating with a backend like Supabase.
  // If you specifically need a static export (SPA), you would add `output: 'export'`.

  // Configure image optimization. Next.js has a built-in Image component.
  // It's crucial to list external domains from which you load images for security.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "your-image-cdn-domain.com", // Replace with your actual image CDN domain
        pathname: "/lovable-uploads/**", // Adjust path if necessary
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // For images hosted on Supabase Storage
      },
      // Add any other domains from which you might load images
    ],
  },

  // Environment variables:
  // Variables prefixed with NEXT_PUBLIC_ are exposed to the client-side.
  // Others are only available on the server.
  // These should be defined in .env.local, .env.development, etc.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Webpack customization, primarily for resolving aliases.
  // Next.js often infers aliases from tsconfig.json, but explicit definition here
  // ensures consistency, matching your previous Vite setup.
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./src"), // Matches the "@/src" alias from your Vite config
    };

    // No Vite-specific plugins (like @vitejs/plugin-react-swc or lovable-tagger)
    // are needed here, as Next.js handles React compilation and other optimizations internally.

    return config;
  },

  // Recommended for identifying potential problems in your application during development.
  reactStrictMode: true,
};

export default nextConfig; // Changed export syntax to ES module style
