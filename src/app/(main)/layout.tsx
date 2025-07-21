"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic"; // Import dynamic

// Dynamically import all client components used in the layout that might access client-only APIs
const DynamicRedirectHandler = dynamic(
  () => import("@/components/RedirectHandler"),
  { ssr: false }
);
const DynamicForumStats = dynamic(
  () => import("@/components/forum/ForumStats"),
  {
    ssr: false,
    loading: () => (
      <Card className="p-4 h-24 animate-pulse bg-muted">
        <div className="text-center">Loading stats...</div>
      </Card>
    ),
  }
);
const DynamicFooter = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
});
const DynamicMobileBottomNav = dynamic(
  () => import("@/components/forum/MobileBottomNav"),
  { ssr: false }
);
const DynamicForumHeader = dynamic(
  () => import("@/components/layout/ForumHeader"),
  { ssr: false }
);
const DynamicForumSidebarNav = dynamic(
  () => import("@/components/layout/ForumSidebarNav"),
  { ssr: false }
);

// The useIsMobile hook itself should be fixed as per previous instructions.
import { useIsMobile } from "@/hooks/use-mobile";

import { Card } from "@/components/ui/card"; // Assuming Card is a client component or safe for SSR

interface ForumLayoutProps {
  children: React.ReactNode;
}

export default function ForumLayout({ children }: ForumLayoutProps) {
  const isMobile = useIsMobile(); // This hook should now handle SSR safely internally

  // --- DEBUGGING: Log isMobile status in ForumLayout ---
  console.log("ForumLayout Debug: isMobile =", isMobile);
  // --- END DEBUGGING ---

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-16">
      {/* Dynamically loaded client components */}
      <DynamicRedirectHandler />
      <DynamicForumHeader />
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
        <div className="flex gap-6 w-full">
          {/* Sidebar - Left side on desktop, hidden on mobile */}
          {!isMobile && (
            <aside className="w-80 flex-shrink-0 space-y-6 overflow-x-hidden">
              <DynamicForumSidebarNav />
              <DynamicForumStats /> {/* Use the dynamically imported version */}
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 w-full overflow-x-hidden">
            <Suspense
              fallback={
                <Card className="p-6">
                  <div className="text-center">Loading content...</div>
                </Card>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>
      {/* Footer */}
      <DynamicFooter />
      {/* Mobile Bottom Navigation - Only render on mobile */}
      {isMobile && <DynamicMobileBottomNav />}
    </div>
  );
}
