// src/app/dashboard/user/layout.tsx
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic"; // Import dynamic

// Dynamically import client components specific to the dashboard layout
const DynamicDashboardHeader = dynamic(
  () => import("@/components/layout/ForumHeader"),
  { ssr: false }
);
const DynamicDashboardSidebarNav = dynamic(
  () => import("@/components/layout/ForumSidebarNav"),
  { ssr: false }
);
const DynamicDashboardFooter = dynamic(
  () => import("@/components/layout/Footer"),
  { ssr: false }
);

// The useIsMobile hook should handle SSR safely internally
import { useIsMobile } from "@/hooks/use-mobile";

import { Card } from "@/components/ui/card"; // Assuming Card is a client component or safe for SSR

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export default function UserDashboardLayout({
  children,
}: UserDashboardLayoutProps) {
  const isMobile = useIsMobile(); // This hook should now handle SSR safely internally

  // --- DEBUGGING: Log isMobile status in UserDashboardLayout ---
  console.log("UserDashboardLayout Debug: isMobile =", isMobile);
  // --- END DEBUGGING ---

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Top Components */}
      {/* Assuming no RedirectHandler needed specifically for user dashboard layout,
          or it's handled at a higher level if it's app-wide. */}
      <DynamicDashboardHeader />

      {/* Main Content Wrapper */}
      {/* Added pb-16 for mobile to account for fixed bottom nav if you add one later, removed on md screens and up */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 overflow-x-hidden pb-16 md:pb-0">
        <div className="flex gap-6 w-full">
          {/* Sidebar Navigation - visible only on non-mobile screens */}
          {!isMobile && (
            <aside className="w-64 flex-shrink-0 space-y-6 overflow-x-hidden">
              <DynamicDashboardSidebarNav />
              {/* If you have dashboard-specific stats or widgets, add them here */}
            </aside>
          )}

          {/* Main content area */}
          <main className="flex-1 min-w-0 w-full overflow-x-hidden">
            <Suspense
              fallback={
                <Card className="p-6">
                  <div className="text-center">
                    Loading dashboard content...
                  </div>
                </Card>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </div>

      {/* Dynamic Footer - positioned at the bottom */}
      <div className="pb-16 md:pb-0">
        <DynamicDashboardFooter />
      </div>

      {/* If you need a mobile bottom navigation for the dashboard, uncomment and import it */}
      {/* <div className="fixed bottom-0 left-0 right-0 w-full md:hidden z-50">
        <DynamicMobileBottomNav />
      </div> */}
    </div>
  );
}
