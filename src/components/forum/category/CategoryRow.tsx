"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCategoryStats } from "@/hooks/useCategoryStats";
import { QuickTopicModal } from "../QuickTopicModal";
import { formatDistanceToNow } from "date-fns";

export interface CategoryWithActivity {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  level: number;
  parent_category_id: string | null;
  region: string | null;
  birth_year: number | null;
  play_level: string | null;
  last_activity_at: string | null;
}

interface CategoryRowProps {
  category: CategoryWithActivity;
}

export const CategoryRow = ({ category }: CategoryRowProps) => {
  const { data: stats } = useCategoryStats(category.id);

  return (
    <div className="group">
      {/* Changed 'to' to 'href' for next/link */}
      <Link href={`/category/${category.slug}`}>
        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Category Info */}
            <div className="sm:col-span-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {category.description}
                    </p>
                    {(category.region ||
                      category.birth_year ||
                      category.play_level) && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {category.region && (
                          <Badge variant="outline" className="text-xs">
                            {category.region}
                          </Badge>
                        )}
                        {category.birth_year && (
                          <Badge variant="outline" className="text-xs">
                            {category.birth_year}
                          </Badge>
                        )}
                        {category.play_level && (
                          <Badge variant="outline" className="text-xs">
                            {category.play_level}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick action button */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <QuickTopicModal
                    preselectedCategoryId={category.id} // Pass category ID for preselection
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.preventDefault()} // Prevent navigation when button is clicked
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Stats - Mobile Layout */}
            <div className="sm:hidden flex justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span>{stats?.topic_count || 0} topics</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{stats?.post_count || 0} posts</span>
                </div>
              </div>
            </div>

            {/* Stats - Desktop Layout */}
            <div className="hidden sm:block sm:col-span-2 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {stats?.topic_count || 0}
              </div>
              <div className="text-xs text-gray-500">topics</div>
            </div>
            <div className="hidden sm:block sm:col-span-2 text-center">
              <div className="text-lg font-semibold text-gray-900">
                {stats?.post_count || 0}
              </div>
              <div className="text-xs text-gray-500">posts</div>
            </div>
            <div className="hidden sm:block sm:col-span-2 text-center">
              <div className="text-xs text-gray-500">
                {category.last_activity_at ? (
                  <div>
                    <div className="font-medium text-gray-700">
                      {formatDistanceToNow(new Date(category.last_activity_at))}{" "}
                      ago
                    </div>
                    <div>Last activity</div>
                  </div>
                ) : (
                  "No recent activity"
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
