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
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Top Components */}
      <DynamicRedirectHandler />
      <DynamicForumHeader />

      {/* Main Content Wrapper: grows to fill space if needed */}
      {/* Added pb-16 for mobile to account for fixed bottom nav, removed on md screens and up */}
      <div className="flex-1 w-full max-w-7xl   px-2 sm:px-4 py-3 sm:py-6 overflow-x-hidden pb-16 md:pb-0">
        <div className="flex gap-6 w-full">
          {!isMobile && (
            <aside className="w-80 flex-shrink-0 space-y-6 overflow-x-hidden">
              <DynamicForumSidebarNav />
              <DynamicForumStats />
            </aside>
          )}

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

      {/* Dynamic Footer - always rendered, its position is determined by the flex layout */}
      {/* On mobile, it will appear above the fixed mobile nav due to main's padding-bottom */}
      <div className="pb-16 md:pb-0">
        <DynamicFooter />
      </div>

      {/* Dynamic Mobile Bottom Navigation - fixed at the bottom, only visible on small screens */}
      <div className="fixed bottom-0 left-0 right-0 w-full md:hidden z-50">
        <DynamicMobileBottomNav />
      </div>
    </div>
  );
}
