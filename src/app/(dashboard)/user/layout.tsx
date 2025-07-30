// src/app/dashboard/user/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, Suspense } from "react"; // Added Suspense
import {
  Home,
  User,
  Settings,
  HelpCircle,
  LogOut, // Added for Sign Out
  Menu,
  X,
  LucideIcon,
  LayoutDashboard, // Using this for dashboard icon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming you have this utility for conditional class names
import { useAuth } from "@/hooks/useAuth"; // For sign out functionality

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export default function UserDashboardLayout({
  children,
}: UserDashboardLayoutProps) {
  const pathname = usePathname();
  const { signOut } = useAuth(); // Get signOut function from useAuth

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Define navigation items for the user dashboard
  const navItems: { path: string; label: string; icon: LucideIcon }[] = [
    { path: "/user", label: "Dashboard", icon: LayoutDashboard }, // Changed to LayoutDashboard for specific dashboard icon
    { path: "/user/profile", label: "Profile", icon: User },
    { path: "/user/settings", label: "Settings", icon: Settings },
    { path: "/user/help", label: "Help", icon: HelpCircle },
  ];

  const renderNavLinks = () =>
    navItems.map(({ path, label, icon: Icon }) => {
      // Determine if the link is active
      const isActive =
        pathname === path || // Exact match
        (pathname.startsWith(path) && pathname.charAt(path.length) === "/user"); // Starts with path and is followed by a slash for sub-paths

      // Special handling for the dashboard root path to ensure only it's active when exactly on it
      const isCurrentPathExactDashboardRoot = pathname === "/user";
      const isThisLinkDashboardRoot = path === "/user";

      const finalIsActive = isCurrentPathExactDashboardRoot
        ? isThisLinkDashboardRoot // If we are exactly at /dashboard/user, only /dashboard/user link is active
        : isActive; // Otherwise, use the startsWith logic for sub-paths

      return (
        <Link
          key={path}
          href={path}
          onClick={() => setMobileOpen(false)} // Close mobile menu on navigation
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            finalIsActive
              ? "bg-primary text-primary-foreground"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Icon className="h-4 w-4" />
          {!collapsed && <span>{label}</span>}
        </Link>
      );
    });

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 fixed top-0 inset-x-0 bg-white border-b shadow-sm z-30 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Back to Forum link */}
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <span className="font-medium text-gray-800 hidden sm:inline">
              Back to Forum
            </span>
          </Link>
        </div>

        {/* Dashboard Title */}
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-500" />{" "}
          {/* User icon for user dashboard */}
          <span className="font-semibold hidden sm:inline">User Dashboard</span>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r hidden md:flex flex-col transition-all duration-300 overflow-y-auto",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="p-4">
            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              className="w-full justify-start mb-4 text-xs"
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {collapsed ? "→" : "← Collapse"}
            </Button>
            {/* Navigation Links */}
            <nav className="space-y-2">{renderNavLinks()}</nav>

            {/* Sign Out Button */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => signOut()} // Call signOut function
              >
                <LogOut className="h-4 w-4 mr-3" />
                {!collapsed && <span>Sign Out</span>}
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay Menu */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 flex md:hidden">
            <div className="w-64 bg-white h-full shadow-lg p-4 relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="absolute top-2 right-2"
              >
                <X className="h-5 w-5" />
              </Button>
              <nav className="mt-8 space-y-2">{renderNavLinks()}</nav>
              {/* Sign Out Button in Mobile Menu */}
              <div className="mt-auto pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    setMobileOpen(false); // Close mobile menu first
                    signOut(); // Then sign out
                  }}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-muted p-4 md:p-6">
          <Suspense
            fallback={
              <Card className="p-6">
                <div className="text-center">Loading dashboard content...</div>
              </Card>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>

      {/* Footer */}
      <footer className="h-10 bg-white border-t px-4 flex items-center justify-center text-sm fixed bottom-0 left-0 right-0 z-10">
        © {new Date().getFullYear()} Rev Sports
      </footer>
    </div>
  );
}
