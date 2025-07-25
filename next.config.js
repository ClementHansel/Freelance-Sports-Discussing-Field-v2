import path from "path";
import { fileURLToPath } from "url";
import { withSentryConfig } from "@sentry/nextjs"; // Corrected: Using import for ES module compatibility

// Get __dirname equivalent in ES modules for path resolution
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

// Combine your nextConfig with Sentry's configuration.
// Ensure withSentryConfig is called ONLY ONCE and wraps your entire nextConfig.
// The export statement has also been updated to use default export with withSentryConfig.
export default withSentryConfig(
  nextConfig, // Your base Next.js configuration
  {
    // Sentry webpack plugin options (first object in withSentryConfig)
    // For all available options, see: https://www.npmjs.com/package/@sentry/webpack-plugin#options
    org: "minorhockeytalkscom",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with older browsers. Recommended for client-side builds.
    transpileClientSDK: true,

    // Hides source maps from browser devtools. Recommended for production builds.
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring", // Keeping this commented as in your original
  },
  {
    // Sentry Next.js plugin options (second object in withSentryConfig)
    // For all available options, see: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    // Don't auto-instrument the SDK (useful if you want to manually initialize Sentry)
    // autoInstrumentServerFunctions: false,
    // autoInstrumentMiddleware: false,
    // autoInstrumentApiRoutes: false,
    // autoInstrumentAppDirectory: false,
    // autoInstrumentPagesDirectory: false,
    // Disable Sentry for specific environments
    // disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
    // disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  }
);
