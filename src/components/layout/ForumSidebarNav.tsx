"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation"; // Import useSearchParams
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Clock,
  Star,
  Plus,
  Home,
  Users,
  LucideIcon,
} from "lucide-react"; // Import LucideIcon type
import { useCategories } from "@/hooks/useCategories"; // Assuming this hook returns Category[]
import { useCategoriesByActivity } from "@/hooks/useCategoriesByActivity"; // Assuming this hook returns Category[]
import { useCategoryStats } from "@/hooks/useCategoryStats"; // Assuming this hook returns { topic_count: number }
import { useEnhancedForumStats } from "@/hooks/useEnhancedForumStats"; // Assuming this hook returns relevant stats
import { QuickTopicModal } from "../forum/QuickTopicModal";
import { SidebarAdBanner } from "@/components/ads/SidebarAdBanner";
import { cn } from "@/lib/utils";

// Define the Category interface based on its usage
export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  // Add other properties if they are part of the category object returned by your hooks
  // e.g., parent_category_id?: string | null;
  // e.g., description?: string | null;
}

// Component to display category stats
const CategoryItem = ({ category }: { category: Category }) => {
  // Typed category prop
  // Assuming useCategoryStats returns an object with a topic_count property
  const { data: stats, isLoading } = useCategoryStats(category.id);

  const pathname = usePathname(); // Get pathname for category active state
  const isCategoryActive = pathname === `/category/${category.slug}`;

  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
        isCategoryActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <span className="text-foreground group-hover:text-primary transition-colors">
          {category.name}
        </span>
      </div>
      <Badge variant="secondary" className="text-xs">
        {isLoading ? "..." : stats?.topic_count || 0}
      </Badge>
    </Link>
  );
};

export default function ForumSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const { data: categories } = useCategoriesByActivity(); // All active categories by activity
  const { data: forumStats } = useEnhancedForumStats(); // Forum wide stats

  // Adjusted isActive to work with Next.js usePathname and useSearchParams
  const isActive = (path: string) => {
    const currentPath = pathname;
    const currentSearchParams = searchParams.toString();

    // Handle root path with no query params
    if (path === "/") {
      return currentPath === "/" && currentSearchParams === "";
    }

    // Handle paths with specific query params (e.g., /?sort=hot)
    if (path.includes("?")) {
      const [basePath, queryString] = path.split("?");
      return currentPath === basePath && currentSearchParams === queryString;
    }

    // Handle regular paths (e.g., /categories)
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon; // Type for Lucide icons
  }

  const navItems: NavItem[] = [
    { label: "Home", path: "/", icon: Home },
    { label: "Hot", path: "/?sort=hot", icon: TrendingUp },
    { label: "New", path: "/?sort=new", icon: Clock },
    { label: "Top", path: "/?sort=top", icon: Star },
  ];

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Browse
        </h3>
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Categories
        </h3>
        <div className="space-y-2">
          {/* Ensure categories is an array before mapping */}
          {categories?.slice(0, 8).map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}

          {categories && categories.length > 8 && (
            <Link href="/categories">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-primary"
              >
                View all categories
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Sidebar Advertisement */}
      <SidebarAdBanner />
    </div>
  );
}
