// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a browser page is loaded.
// To learn more, see the Sentry Next.js documentation:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    // Replace with your actual Sentry DSN from .env.local or .env
    // It's good practice to use process.env.NEXT_PUBLIC_SENTRY_DSN here
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,

    // Set `debug` to `true` to get more helpful output in development.
    debug: false,

    replaysSessionSampleRate: 0.1, // This enables session replay
    replaysOnErrorSampleRate: 1.0, // This enables session replay when an error occurs

    // You can also enable HTTP tracing
    // integrations: [new Sentry.BrowserTracing()],

    // Environment (optional, but good for filtering in Sentry UI)
    environment: process.env.NODE_ENV || "development",
});
