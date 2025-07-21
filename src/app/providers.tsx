"use client"; // This directive marks the component as a Client Component

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip"; // Assuming this path is correct for shadcn/ui
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import dynamic from "next/dynamic"; // Import dynamic

// Import your custom providers and components
// Dynamically import all client components that might access client-only APIs
const DynamicAuthProvider = dynamic(
  () =>
    import("@/components/auth/AuthProvider").then((mod) => mod.AuthProvider), // Explicitly get the named export
  { ssr: false }
);
const DynamicOnlineUsersProvider = dynamic(
  () =>
    import("@/contexts/OnlineUsersContext").then(
      (mod) => mod.OnlineUsersProvider
    ), // Explicitly get the named export
  { ssr: false }
);
const DynamicAnalyticsProvider = dynamic(
  () =>
    import("@/components/dashboard/analytics/AnalyticsProvider").then(
      (mod) => mod.AnalyticsProvider
    ), // Explicitly get the named export
  { ssr: false }
);
const DynamicEnhancedHeaderCodeInjector = dynamic(
  () =>
    import("@/components/dashboard/analytics/EnhancedHeaderCodeInjector").then(
      (mod) => mod.EnhancedHeaderCodeInjector
    ), // Explicitly get the named export
  { ssr: false }
);
const DynamicCookieConsent = dynamic(
  () =>
    import("@/components/cookies/CookieConsent").then(
      (mod) => mod.CookieConsent
    ), // Explicitly get the named export
  { ssr: false }
);
const DynamicCookieDebugPanel = dynamic(
  () =>
    import("@/components/cookies/CookieDebugPanel").then(
      (mod) => mod.CookieDebugPanel
    ), // Explicitly get the named export
  { ssr: false }
);
const DynamicMaintenanceWrapper = dynamic(
  () =>
    import("@/components/MaintenanceWrapper").then(
      (mod) => mod.MaintenanceWrapper
    ), // Explicitly get the named export
  { ssr: false }
);
const DynamicStickyBanner = dynamic(
  () => import("@/components/StickyBanner").then((mod) => mod.StickyBanner), // Explicitly get the named export
  { ssr: false }
);
const DynamicIPTrackingWrapper = dynamic(
  () =>
    import("@/components/IPTrackingWrapper").then(
      (mod) => mod.IPTrackingWrapper
    ), // Explicitly get the named export
  { ssr: false }
);
const DynamicVPNGuard = dynamic(
  () => import("@/components/VPNGuard").then((mod) => mod.VPNGuard), // Explicitly get the named export
  { ssr: false }
);
const DynamicErrorBoundary = dynamic(
  () => import("@/components/ErrorBoundary").then((mod) => mod.ErrorBoundary), // Explicitly get the named export (class component)
  { ssr: false }
);
const DynamicScrollToTop = dynamic(
  () => import("@/components/ScrollToTop").then((mod) => mod.ScrollToTop), // Explicitly get the named export
  { ssr: false }
);

// Initialize QueryClient outside the component to prevent re-creation on re-renders
const queryClient = new QueryClient();

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Use dynamically imported components */}
        <DynamicAuthProvider>
          <DynamicOnlineUsersProvider>
            <DynamicStickyBanner />
            <DynamicEnhancedHeaderCodeInjector />
            <DynamicCookieConsent />
            <Toaster />{" "}
            {/* Shadcn Toaster is likely fine, but can be dynamic if needed */}
            <Sonner />{" "}
            {/* Shadcn Sonner is likely fine, but can be dynamic if needed */}
            <DynamicAnalyticsProvider>
              <DynamicIPTrackingWrapper>
                <DynamicCookieDebugPanel />
                <DynamicScrollToTop />
                <DynamicMaintenanceWrapper>
                  <DynamicErrorBoundary>
                    <DynamicVPNGuard>{children}</DynamicVPNGuard>
                  </DynamicErrorBoundary>
                </DynamicMaintenanceWrapper>
              </DynamicIPTrackingWrapper>
            </DynamicAnalyticsProvider>
          </DynamicOnlineUsersProvider>
        </DynamicAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
