// src/components/layout/ForumSidebarNav.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  MessageSquare,
} from "lucide-react";
import { useCategories, Category } from "@/hooks/useCategories";
import {
  useCategoriesByActivity,
  CategoryWithActivity,
} from "@/hooks/useCategoriesByActivity";
import { useCategoryStats } from "@/hooks/useCategoryStats";
import { useEnhancedForumStats } from "@/hooks/useEnhancedForumStats";
import { QuickTopicModal } from "../forum/QuickTopicModal";
import { SidebarAdBanner } from "@/components/ads/SidebarAdBanner";
import { cn } from "@/lib/utils";
import { useForumSettings, ForumSettingsMap } from "@/hooks/useForumSettings";

// Component to display category stats
const CategoryItem = ({
  category,
}: {
  category: Category | CategoryWithActivity;
}) => {
  const { data: stats, isLoading } = useCategoryStats(category.id);

  const pathname = usePathname();
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
          style={{ backgroundColor: category.color ?? "" }}
        />
        <span className="text-foreground group-hover:text-primary transition-colors">
          {category.name}
        </span>
      </div>
      <Badge variant="secondary" className="text-xs">
        {isLoading
          ? "..."
          : (category as CategoryWithActivity).topic_count ??
            (stats?.topic_count || 0)}
      </Badge>
    </Link>
  );
};

interface ForumSidebarNavProps {
  initialCategories?: CategoryWithActivity[];
  initialForumSettings?: ForumSettingsMap;
  errorOccurred?: boolean; // This prop indicates if an error occurred during SSR data fetching
}

export default function ForumSidebarNav({
  initialCategories,
  initialForumSettings,
  errorOccurred,
}: ForumSidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // FIXED: Call useCategoriesByActivity with a single options object
  const {
    data: categories,
    isLoading: areCategoriesLoading,
    error: categoriesError,
  } = useCategoriesByActivity({ initialData: initialCategories });

  // FIXED: Call useForumSettings with a single options object and destructure 'error'
  const {
    settings: forumSettings,
    isLoading: areForumSettingsLoading,
    error: forumSettingsError, // Now correctly destructured
  } = useForumSettings({ initialData: initialForumSettings });

  const {
    data: enhancedForumStats,
    isLoading: areEnhancedForumStatsLoading,
    error: enhancedForumStatsError,
  } = useEnhancedForumStats();

  const [quickTopicModalOpen, setQuickTopicModalOpen] = useState(false);

  // --- DEBUGGING LOGS (can be removed after verification) ---
  console.group("ForumSidebarNav Debugging");
  console.log("Initial Categories Prop:", initialCategories);
  console.log("Categories Data (from hook):", categories);
  console.log("Categories Loading (from hook):", areCategoriesLoading);
  console.log("Categories Error (from hook):", categoriesError);
  if (categories) {
    console.log("Categories Array Length (from hook):", categories.length);
    if (categories.length > 0) {
      console.log("First Category Item (from hook):", categories[0]);
    }
  } else {
    console.log("Categories data is null or undefined (from hook).");
  }

  console.log("Initial Forum Settings Prop:", initialForumSettings);
  console.log("Forum Settings Data (from hook):", forumSettings);
  console.log("Forum Settings Loading (from hook):", areForumSettingsLoading);
  console.log("Forum Settings Error (from hook):", forumSettingsError);

  console.log("Enhanced Forum Stats Data (from hook):", enhancedForumStats);
  console.log(
    "Enhanced Forum Stats Loading (from hook):",
    areEnhancedForumStatsLoading
  );
  console.log(
    "Enhanced Forum Stats Error (from hook):",
    enhancedForumStatsError
  );
  console.groupEnd();
  // --- END DEBUGGING LOGS ---

  const isActive = (path: string) => {
    const currentPath = pathname;
    const currentSearchParams = searchParams.toString();

    if (path === "/") {
      return currentPath === "/" && currentSearchParams === "";
    }

    if (path.includes("?")) {
      const [basePath, queryString] = path.split("?");
      return currentPath === basePath && currentSearchParams === queryString;
    }

    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
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
          {/* Check for SSR error (errorOccurred) OR client-side hook error (categoriesError) */}
          {errorOccurred || categoriesError ? (
            <p className="text-red-500 text-sm">Error loading categories.</p>
          ) : areCategoriesLoading ? (
            <p className="text-muted-foreground text-sm">
              Loading categories...
            </p>
          ) : categories && categories.length > 0 ? (
            categories
              .slice(0, 8)
              .map((category) => (
                <CategoryItem key={category.id} category={category} />
              ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No categories available.
            </p>
          )}

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

      {/* Forum Statistics
      {errorOccurred || enhancedForumStatsError ? (
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Forum Stats
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="text-red-500 text-sm">
              Error loading forum statistics.
            </p>
          </div>
        </Card>
      ) : areEnhancedForumStatsLoading ? (
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Forum Stats
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Loading forum statistics...</p>
          </div>
        </Card>
      ) : enhancedForumStats ? (
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            Forum Stats
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Total Topics: {enhancedForumStats.total_topics ?? 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>
                Total Members: {enhancedForumStats.total_members ?? 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Topics Today: {enhancedForumStats.topics_today ?? 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Posts Today: {enhancedForumStats.posts_today ?? 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>
                New Members Today: {enhancedForumStats.members_today ?? 0}
              </span>
            </div>
            {enhancedForumStats.most_active_category && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Most Active Category:{" "}
                  {enhancedForumStats.most_active_category}
                </span>
              </div>
            )}
            {enhancedForumStats.top_poster && (
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Top Poster: {enhancedForumStats.top_poster}</span>
              </div>
            )}
          </div>
        </Card>
      ) : null} */}

      {/* Sidebar Advertisement */}
      <SidebarAdBanner />
    </div>
  );
}
