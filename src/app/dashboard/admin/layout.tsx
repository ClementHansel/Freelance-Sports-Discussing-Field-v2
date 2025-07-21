"use client"; // This component uses client-side hooks, so it must be a Client Component

import React from "react";
import Link from "next/link"; // Replaced react-router-dom Link with next/link
import { usePathname, useRouter } from "next/navigation"; // Replaced useLocation with usePathname and added useRouter
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Home,
  Flag,
  Search,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions"; // Assuming usePermissions is a client-side hook

interface AdminLayoutProps {
  children: React.ReactNode; // Next.js layouts use the 'children' prop instead of Outlet
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname(); // Get current pathname from Next.js
  const router = useRouter(); // Initialize useRouter for programmatic navigation
  const { canViewAdminPanel } = usePermissions();

  if (!canViewAdminPanel) {
    // Use router.replace for redirection in Next.js
    // This will replace the current history entry, similar to react-router-dom's { replace: true }
    router.replace("/"); // Redirect to home if not authorized
    return (
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have permission to access the admin panel.
        </p>
        <Button asChild>
          <Link href="/">Return to Forum</Link> {/* Changed 'to' to 'href' */}
        </Button>
      </Card>
    );
  }

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: BarChart3 },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/content", label: "Content", icon: MessageSquare },
    { path: "/admin/moderation", label: "Moderation", icon: Flag },
    { path: "/admin/spam", label: "Spam Management", icon: AlertTriangle },
    { path: "/admin/advertising", label: "Advertising", icon: DollarSign },
    { path: "/admin/seo", label: "SEO", icon: Search },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                {" "}
                {/* Changed 'to' to 'href' */}
                <Home className="h-5 w-5" />
                <span>Back to Forum</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500" />
              <span className="font-semibold">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64">
            <Card className="p-4">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  // Check if the current pathname starts with the item's path for active state,
                  // allowing for nested admin routes (e.g., /admin/users/123 should still highlight /admin/users)
                  const isActive = pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      href={item.path} // Changed 'to' to 'href'
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </aside>

          <main className="flex-1">
            {children} {/* Replaced Outlet with children prop */}
          </main>
        </div>
      </div>
    </div>
  );
};
