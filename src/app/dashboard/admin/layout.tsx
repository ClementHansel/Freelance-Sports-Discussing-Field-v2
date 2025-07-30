// src/app/dashboard/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  Shield,
  Home,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Flag,
  Search,
  AlertTriangle,
  DollarSign,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { canViewAdminPanel } = usePermissions();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!canViewAdminPanel) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have permission to access the admin panel.
        </p>
        <Button asChild>
          <Link href="/">Return to Forum</Link>
        </Button>
      </Card>
    );
  }

  const navItems: { path: string; label: string; icon: LucideIcon }[] = [
    { path: "/dashboard/admin", label: "Dashboard", icon: BarChart3 },
    { path: "/dashboard/admin/users", label: "Users", icon: Users },
    { path: "/dashboard/admin/content", label: "Content", icon: MessageSquare },
    { path: "/dashboard/admin/moderation", label: "Moderation", icon: Flag },
    {
      path: "/dashboard/admin/spam",
      label: "Spam Management",
      icon: AlertTriangle,
    },
    {
      path: "/dashboard/admin/advertising",
      label: "Advertising",
      icon: DollarSign,
    },
    { path: "/dashboard/admin/seo", label: "SEO", icon: Search },
    { path: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ];

  const renderNavLinks = () =>
    navItems.map(({ path, label, icon: Icon }) => {
      // FIXED: Improved isActive logic
      const isActive =
        pathname === path || // Exact match
        (pathname.startsWith(path) &&
          pathname.charAt(path.length) === "/dashboard"); // Starts with path AND is followed by a slash (for sub-paths)

      // Special case for the root dashboard path if it's just '/admin'
      // If pathname is exactly '/admin', only the '/admin' link should be active.
      // If pathname is '/admin/users', then '/admin/users' should be active, not '/admin'.
      const isCurrentPathExactDashboardRoot = pathname === "/dashboard/admin";
      const isThisLinkDashboardRoot = path === "/dashboard/admin";

      const finalIsActive = isCurrentPathExactDashboardRoot
        ? isThisLinkDashboardRoot // If we are exactly at /admin, only /admin link is active
        : isActive; // Otherwise, use the startsWith logic for sub-paths

      return (
        <Link
          key={path}
          href={path}
          onClick={() => setMobileOpen(false)}
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
      <header className="h-14 fixed top-0 inset-x-0 bg-white border-b shadow-sm z-30 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <span className="font-medium text-gray-800 hidden sm:inline">
              Back to Forum
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          <span className="font-semibold hidden sm:inline">Admin Panel</span>
        </div>
      </header>

      <div className="flex flex-1 pt-14 overflow-hidden">
        <aside
          className={cn(
            "bg-white border-r hidden md:flex flex-col transition-all duration-300 overflow-y-auto",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start mb-4 text-xs"
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {collapsed ? "→" : "← Collapse"}
            </Button>
            <nav className="space-y-2">{renderNavLinks()}</nav>
          </div>
        </aside>

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
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-muted p-4 md:p-6">
          {children}
        </main>
      </div>

      <footer className="h-10 bg-white border-t px-4 flex items-center justify-center text-sm fixed bottom-0 left-0 right-0 z-10">
        © {new Date().getFullYear()} Rev Sports
      </footer>
    </div>
  );
}
