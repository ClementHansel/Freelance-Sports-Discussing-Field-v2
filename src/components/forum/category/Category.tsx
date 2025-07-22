"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  User,
  Clock,
  Pin,
  Plus,
  ChevronRight,
  Home,
  HelpCircle,
} from "lucide-react";

import { useCategoriesByActivity } from "@/hooks/useCategoriesByActivity";
import {
  useCategoryBySlug,
  // Removed 'Category as BaseCategoryFromHook' as we're no longer extending it
} from "@/hooks/useCategories";
import {
  useTopicsLegacy as useTopics,
  // Removed 'Topic as BaseTopicFromHook' as we're no longer extending it
} from "@/hooks/useTopicsLegacy";
import { useAuth } from "@/hooks/useAuth";
import { useCategoryStats } from "@/hooks/useCategoryStats";
import { formatDistanceToNow } from "date-fns";
import { QuickTopicModal } from "@/components/forum/QuickTopicModal";
import { CategoryRequestModal } from "@/components/forum/category/CategoryRequestModal";
import { AdminControls } from "@/components/forum/admin-ui/AdminControls";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Import the comprehensive Topic interface from AdminTopicInfo.
// We will use this directly instead of creating a redundant alias.
import { Topic as AdminTopicInfoTopic } from "@/components/forum/admin-ui/AdminTopicInfo";
import { Post } from "@/components/forum/admin-ui/AdminPostInfo"; // Import Post for ContentType

// Define the Category interface. This is the canonical Category interface for this file
// and is also exported for use by AdminControls (via CategoryView.tsx).
// It no longer extends BaseCategoryFromHook to avoid the 'level' type incompatibility.
export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  level: number | null; // Explicitly allow null, as intended by your application logic
  parent_category_id: string | null;
  parent_category: Category | null; // Recursive definition, allowing null
  requires_moderation?: boolean | null; // Specific to this app's category logic
  last_activity_at?: string | null; // Specific to this app's category logic
  region?: string | null; // Specific to this app's category logic
  birth_year?: number | null; // Specific to this app's category logic
  play_level?: string | null; // Specific to this app's category logic
}

// REMOVED: The redundant 'Topic' interface.
// We will now use 'AdminTopicInfoTopic' directly where 'Topic' was previously used.

// Define a union type for the 'content' prop for AdminControls
// This should now be compatible with the updated Topic and Category interfaces
type ContentType = Post | AdminTopicInfoTopic | Category; // CHANGED: Used AdminTopicInfoTopic directly

// Helper function to build breadcrumb hierarchy
const buildBreadcrumbHierarchy = (category: Category | null) => {
  const breadcrumbs: { name: string; slug: string; id: string }[] = [];
  let current: Category | null = category;

  // Build breadcrumb hierarchy by traversing parent_category chain
  while (current) {
    breadcrumbs.unshift({
      name: current.name,
      slug: current.slug,
      id: current.id,
    });

    // Move to parent category, handling if it's optional or null
    current = current.parent_category || null;
  }
  return breadcrumbs;
};

const SubcategoryCard = ({ subcat }: { subcat: Category }) => {
  const { data: stats } = useCategoryStats(subcat.id);

  return (
    <Link href={`/category/${subcat.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: subcat.color }}
            />
            <h3 className="font-semibold text-sm text-gray-900">
              {subcat.name}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {subcat.description}
        </p>
        <div className="flex items-center text-xs text-gray-500 space-x-4">
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>{stats?.topic_count || 0} topics</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{stats?.post_count || 0} posts</span>
          </div>
          {subcat.last_activity_at && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(subcat.last_activity_at))} ago
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

// Main page component
export default function CategorySlug() {
  const params = useParams();
  const router = useRouter();

  const categorySlugParam = params.categorySlug;
  let currentCategorySlug: string | undefined;

  if (Array.isArray(categorySlugParam)) {
    currentCategorySlug = categorySlugParam[categorySlugParam.length - 1];
  } else {
    currentCategorySlug = categorySlugParam;
  }

  const { user } = useAuth();

  const {
    data: rawCategory,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryBySlug(currentCategorySlug || "");

  // Explicitly cast the raw data to our Category type.
  // This is necessary because we no longer extend BaseCategoryFromHook directly.
  const category: Category | undefined = rawCategory as Category | undefined;

  const { data: rawSubcategories, isLoading: subcategoriesLoading } =
    useCategoriesByActivity(
      category?.id,
      category?.level ? category.level + 1 : undefined
    );
  const subcategories: Category[] | undefined = rawSubcategories as
    | Category[]
    | undefined;

  const { data: rawTopics, isLoading: topicsLoading } = useTopics(category?.id);
  // CHANGED: Use AdminTopicInfoTopic directly for 'topics'
  const topics: AdminTopicInfoTopic[] | undefined = rawTopics as
    | AdminTopicInfoTopic[]
    | undefined;

  if (categoryLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!category && !categoryLoading) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Category not found
        </h2>
        <p className="text-gray-600 mt-2">
          The category "{currentCategorySlug || "N/A"}" doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const hasSubcategories = subcategories && subcategories.length > 0;
  const isLevel3Category = category?.level === 3; // This variable is not used, but kept for context

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Breadcrumb */}
      {category && (
        <Breadcrumb className="overflow-x-auto">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Render breadcrumbs based on the full path segments */}
            {buildBreadcrumbHierarchy(category)
              .map((breadcrumb, index, array) => [
                <BreadcrumbSeparator key={`sep-${breadcrumb.id}`} />,
                <BreadcrumbItem key={breadcrumb.id}>
                  {index === array.length - 1 ? (
                    <BreadcrumbPage className="max-w-full truncate">
                      {breadcrumb.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={`/category/${breadcrumb.slug}`}
                        className="max-w-full truncate"
                      >
                        {breadcrumb.name}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>,
              ])
              .flat()}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Category Header */}
      {category && (
        <Card className="p-4 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 truncate">
                    {category.name}
                  </h1>
                </div>
                <AdminControls
                  content={category} // Pass the category directly
                  contentType="category"
                  onDelete={() => router.push("/")} // Redirect to home after delete
                />
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {category.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                {category.region && <span>Region: {category.region}</span>}
                {category.birth_year && (
                  <span>Birth Year: {category.birth_year}</span>
                )}
                {category.play_level && (
                  <span>Level: {category.play_level}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Show different content based on category level and moderation requirements */}
              {category.level === 3 ||
              (category.level === 2 && !category.requires_moderation) ? (
                // Level 3 categories and level 2 categories without moderation allow topic creation
                <>
                  <QuickTopicModal
                    preselectedCategoryId={category.id}
                    trigger={
                      <Button size="sm" className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Discussion
                      </Button>
                    }
                  />

                  {/* Category request button */}
                  <CategoryRequestModal
                    currentCategoryId={category.id}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          Request Category
                        </span>
                        <span className="sm:hidden">Request</span>
                      </Button>
                    }
                  />
                </>
              ) : (
                // Level 1 categories and level 2 categories requiring moderation are for browsing only
                <div className="flex flex-col items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Browse Only - Select a{" "}
                    {category.slug?.includes("general")
                      ? "Category"
                      : category.slug?.includes("tournaments")
                      ? "Location"
                      : category.slug?.includes("usa") ||
                        category.region === "USA"
                      ? "State"
                      : "Province"}{" "}
                    to Post
                  </Badge>
                  <CategoryRequestModal
                    currentCategoryId={category.id}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          Request Category
                        </span>
                        <span className="sm:hidden">Request</span>
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Subcategories or Topics */}
      {category && hasSubcategories ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Browse Categories
            </h2>
            <div className="text-xs sm:text-sm text-gray-500">
              Can't find what you're looking for?{" "}
              <CategoryRequestModal
                currentCategoryId={category.id}
                trigger={
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-blue-600 text-xs sm:text-sm"
                  >
                    Request a new category
                  </Button>
                }
              />
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {subcategories!.map((subcat) => (
              <SubcategoryCard key={subcat.id} subcat={subcat} />
            ))}
          </div>
        </>
      ) : category ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Topics
            </h2>
          </div>
          <Card className="p-3 sm:p-6 w-full">
            {topicsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 sm:h-20 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : topics && topics.length > 0 ? (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-3 sm:gap-4"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {topic.is_pinned && (
                          <Pin className="h-4 w-4 text-red-500" />
                        )}
                        <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            href={
                              topic.slug && category.slug
                                ? `/category/${category.slug}/${topic.slug}`
                                : `/topic/${topic.id}`
                            }
                            className="font-medium text-gray-900 hover:text-blue-600 text-sm sm:text-base line-clamp-2 flex-1"
                          >
                            {topic.title}
                          </Link>
                          {/* Pass the topic directly, now that its type is fully compatible */}
                          <AdminControls content={topic} contentType="topic" />
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-500">
                          <span>
                            by {topic.profiles?.username || "Anonymous User"}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            Created{" "}
                            {formatDistanceToNow(
                              new Date(topic.created_at ?? "")
                            )}{" "}
                            ago
                          </span>
                          {topic.last_reply_at &&
                            (topic.reply_count ?? 0) > 0 && (
                              <>
                                <span>•</span>
                                {topic.last_post_id ? (
                                  <Link
                                    href={`/category/${category.slug}/${topic.slug}#post-${topic.last_post_id}`}
                                    className="hover:text-primary transition-colors"
                                  >
                                    Last reply{" "}
                                    {formatDistanceToNow(
                                      new Date(topic.last_reply_at ?? "")
                                    )}{" "}
                                    ago
                                  </Link>
                                ) : (
                                  <span>
                                    Last reply{" "}
                                    {formatDistanceToNow(
                                      new Date(topic.last_reply_at ?? "")
                                    )}{" "}
                                    ago
                                  </span>
                                )}
                              </>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 sm:h-4 w-3 sm:w-4" />
                          <span>{topic.reply_count || 0}</span>
                        </div>
                        <span className="text-xs hidden sm:block">replies</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 sm:h-4 w-3 sm:w-4" />
                          <span>{topic.view_count || 0}</span>
                        </div>
                        <span className="text-xs hidden sm:block">views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  No topics yet
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Be the first to start a discussion in this category!
                </p>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
