// src/components/forum/category/CategoryView.tsx
"use client";

import React, { useState, useEffect } from "react"; // Added useState, useEffect
import { useParams, useRouter, useSearchParams } from "next/navigation"; //
import Link from "next/link"; //
import { Card } from "@/components/ui/card"; //
import { Button } from "@/components/ui/button"; //
import { Badge } from "@/components/ui/badge"; //
import {
  MessageSquare, //
  User, //
  Clock, //
  Pin, //
  Plus, //
  ChevronRight, //
  Home, //
  HelpCircle, //
  TrendingUp, // Added for sorting buttons
} from "lucide-react"; //

// Import canonical types from hooks
import {
  Category, //
  useCategories, // Keep useCategories for allCategoriesForBreadcrumbs
} from "@/hooks/useCategories"; //
// CORRECTED: Import useCategoryBySlug from its specific file for hierarchical logic
import { useCategoryBySlug } from "@/hooks/useCategoryBySlug"; //
import {
  useCategoriesByActivity, //
  CategoryWithActivity, //
} from "@/hooks/useCategoriesByActivity"; //
import {
  useTopics, //
  Topic as HookTopic, //
  PaginatedTopicsResult, //
} from "@/hooks/useTopics"; //
import { useAuth } from "@/hooks/useAuth"; //
import { useCategoryStats } from "@/hooks/useCategoryStats"; //
import { useForumSettings, ForumSettingsMap } from "@/hooks/useForumSettings"; //
import { formatDistanceToNow } from "date-fns"; //
import { QuickTopicModal } from "../QuickTopicModal"; //
import { CategoryRequestModal } from "./CategoryRequestModal"; //

import {
  Breadcrumb, //
  BreadcrumbEllipsis, //
  BreadcrumbItem, //
  BreadcrumbLink, //
  BreadcrumbList, //
  BreadcrumbPage, //
  BreadcrumbSeparator, //
} from "@/components/ui/breadcrumb"; //
import { PostCard, PostCardTopic } from "@/components/forum/PostCard"; //
import { PaginationControls } from "@/components/ui/pagination-controls"; //
import { ReportModal } from "../ReportModal"; //

// Import specific types for AdminControls content
import { Topic as AdminTopicInfoTopic } from "@/components/forum/category/AdminTopicInfo"; //
// CORRECTED: Import Post from AdminPostInfo.tsx
import { Post as AdminPostInfoPost } from "@/components/forum/category/AdminPostInfo"; //
// No longer need to import Post from '@/hooks/usePosts' directly for AdminControlsContentType
// import { Post } from "@/hooks/usePosts";
import { AdminControls } from "./AdminControls"; //

// Define the ContentType for AdminControls
type AdminControlsContentType =
  | AdminPostInfoPost
  | AdminTopicInfoTopic
  | Category; //

// CORRECTED: Renamed to CategoryViewProps and added initialCategoryData
interface CategoryViewProps {
  initialCategoryData?: {
    // Added initialCategoryData to the interface
    category: Category | null; //
    topics: PaginatedTopicsResult | null; //
    subcategories: CategoryWithActivity[] | null; //
    forumSettings: ForumSettingsMap | null; //
  };
  categorySlug: string; //
  subcategorySlug?: string; // Added subcategorySlug to props
  currentPage: number; //
  sortBy: string; //
}

// Helper function to build breadcrumb hierarchy
const buildBreadcrumbHierarchy = (
  currentCategory: Category | null | undefined,
  allPossibleCategories: Category[] | undefined
) => {
  const breadcrumbs: { name: string; slug: string; id: string }[] = [];
  let current: Category | null | undefined = currentCategory;

  while (current) {
    breadcrumbs.unshift({
      name: current.name,
      slug: current.slug,
      id: current.id,
    });

    current = allPossibleCategories?.find(
      (cat) => cat.id === current?.parent_category_id
    );
  }
  return breadcrumbs;
};

// SubcategoryCard now expects CategoryWithActivity
const SubcategoryCard = ({ subcat }: { subcat: CategoryWithActivity }) => {
  const { data: stats } = useCategoryStats(subcat.id); //

  return (
    <Link href={`/category/${subcat.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: subcat.color ?? "" }}
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
            <span>{subcat.topic_count ?? stats?.topic_count ?? 0} topics</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{subcat.post_count ?? stats?.post_count ?? 0} posts</span>
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

export const CategoryView = ({
  initialCategoryData,
  categorySlug,
  subcategorySlug,
  currentPage: propCurrentPage, // Renamed to avoid conflict with state
  sortBy: propSortBy, // Renamed to avoid conflict with state
}: CategoryViewProps) => {
  const router = useRouter(); //
  const searchParams = useSearchParams(); // Use useSearchParams for current URL params
  const params = useParams(); // Use useParams to get route segments

  const { user, isAdmin, isModerator } = useAuth(); //

  const [quickTopicModalOpen, setQuickTopicModalOpen] = useState(false); //
  const [categoryRequestModalOpen, setCategoryRequestModalOpen] =
    useState(false); //
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    topicId?: string;
  }>({ isOpen: false }); //

  const [currentPage, setCurrentPage] = useState(propCurrentPage); //
  const [sortBy, setSortBy] = useState(propSortBy); //

  // Fetch current category data
  const { data: currentCategory, isLoading: isLoadingCategory } =
    useCategoryBySlug({
      // Now correctly passing an object
      categorySlug: categorySlug, // Use categorySlug from props
      subcategorySlug: subcategorySlug, // Use subcategorySlug from props
      initialData: initialCategoryData?.category ?? null, // Now accepts null
      enabled: !!categorySlug, // Enable if categorySlug is present
    }); //

  // Fetch topics for the current category
  const { data: topicsData, isLoading: isLoadingTopics } = useTopics({
    categoryId: currentCategory?.id, //
    page: currentPage, //
    limit: 10, // Assuming a limit of 10 topics per page
    orderBy: sortBy === "hot" ? "hot_score" : "created_at", // Sort by created_at for 'new', view_count for 'top'
    ascending: sortBy === "new" ? false : false, // Newest first, highest views first
    initialData: initialCategoryData?.topics ?? undefined, // Use ?? undefined
    enabled: !!currentCategory?.id, // Only fetch topics if category ID is available
  }); //

  // Fetch subcategories for the current category
  const { data: subcategories, isLoading: isLoadingSubcategories } =
    useCategoriesByActivity({
      parentId: currentCategory?.id || null, // Pass null for root categories
      initialData: initialCategoryData?.subcategories ?? undefined, // Use ?? undefined
      enabled: !!currentCategory?.id, // Only fetch subcategories if category ID is available
    }); //

  // Fetch all categories for breadcrumbs
  const { data: allCategoriesForBreadcrumbs, isLoading: allCategoriesLoading } =
    useCategories({
      enabled: !!currentCategory, // Only fetch if currentCategory is available
    }); //

  // Fetch category stats
  const { data: categoryStats, isLoading: isLoadingCategoryStats } =
    useCategoryStats(currentCategory?.id || ""); // Removed second argument

  // Fetch forum settings
  const { settings: forumSettings, isLoading: isLoadingForumSettings } =
    useForumSettings({
      initialData: initialCategoryData?.forumSettings ?? undefined, // Use ?? undefined
    }); //

  const isLoading =
    isLoadingCategory ||
    isLoadingTopics ||
    isLoadingSubcategories ||
    isLoadingCategoryStats ||
    isLoadingForumSettings ||
    allCategoriesLoading; // Include allCategoriesLoading in overall loading state

  // Update URL search params when tab or page changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(); //
    if (sortBy !== "new") {
      newSearchParams.set("sort", sortBy); //
    }
    if (currentPage !== 1) {
      newSearchParams.set("page", currentPage.toString()); //
    }
    // Construct the path based on categorySlug and subcategorySlug
    let path = `/category/${categorySlug}`; //
    if (subcategorySlug) {
      path += `/${subcategorySlug}`; //
    }
    router.replace(`${path}?${newSearchParams.toString()}`, { scroll: false }); //
  }, [sortBy, currentPage, router, categorySlug, subcategorySlug]); // Added categorySlug, subcategorySlug to dependencies

  const handlePageChange = (page: number) => {
    setCurrentPage(page); //
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort); //
    setCurrentPage(1); // Reset page to 1 when changing sort
  };

  const handleReportTopic = (topicId: string) => {
    setReportModal({ isOpen: true, topicId }); //
  };

  // CORRECTED: Compare with boolean true
  const canCreateTopic =
    user ||
    (forumSettings?.["anonymous_posting_enabled"]?.value === true && //
      forumSettings?.["anonymous_topic_creation_enabled"]?.value === true); //

  const [breadcrumbs, setBreadcrumbs] = useState<
    {
      name: string;
      slug: string;
      id: string;
      href: string;
      isCurrent?: boolean;
    }[]
  >([]); //

  useEffect(() => {
    if (currentCategory && allCategoriesForBreadcrumbs) {
      const built = buildBreadcrumbHierarchy(
        currentCategory,
        allCategoriesForBreadcrumbs
      ); //
      // Map the built hierarchy to include `href` and `isCurrent`
      const finalBreadcrumbs = built.map((crumb, idx) => ({
        ...crumb,
        href: `/category/${crumb.slug}`, // Default href
        isCurrent: idx === built.length - 1, //
      })); //

      // Adjust href for hierarchical paths if needed
      if (currentCategory.level === 3 && subcategorySlug) {
        const parent2 = allCategoriesForBreadcrumbs.find(
          (cat) => cat.id === currentCategory.parent_category_id
        ); //
        const parent1 = parent2
          ? allCategoriesForBreadcrumbs.find(
              (cat) => cat.id === parent2.parent_category_id
            )
          : null; //

        if (parent1 && parent2) {
          finalBreadcrumbs[0].href = `/category/${parent1.slug}`; //
          finalBreadcrumbs[1].href = `/category/${parent1.slug}/${parent2.slug}`; //
        }
      } else if (
        currentCategory.level === 2 &&
        currentCategory.parent_category_id
      ) {
        const parent1 = allCategoriesForBreadcrumbs.find(
          (cat) => cat.id === currentCategory.parent_category_id
        ); //
        if (parent1) {
          finalBreadcrumbs[0].href = `/category/${parent1.slug}`; //
        }
      }
      setBreadcrumbs(finalBreadcrumbs); //
    } else if (currentCategory) {
      // Fallback for single-level category if allCategoriesForBreadcrumbs is not ready
      setBreadcrumbs([
        {
          name: currentCategory.name,
          slug: currentCategory.slug,
          id: currentCategory.id,
          href: `/category/${currentCategory.slug}`,
          isCurrent: true,
        },
      ]); //
    }
  }, [currentCategory, allCategoriesForBreadcrumbs, subcategorySlug]); //

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 sm:h-20 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentCategory && !isLoading) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Category not found
        </h2>
        <p className="text-gray-600 mt-2">
          The category "{categorySlug || "N/A"}" doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const hasSubcategories = subcategories && subcategories.length > 0; //
  const isLevel3Category = currentCategory?.level === 3; //

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Breadcrumb */}
      {currentCategory && (
        <Breadcrumb className="overflow-x-auto">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.isCurrent ? (
                    <BreadcrumbPage className="max-w-full truncate">
                      {crumb.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="max-w-full truncate">
                        {crumb.name}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Category Header */}
      {currentCategory && (
        <Card className="p-4 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: currentCategory.color ?? "" }}
                  />
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 truncate">
                    {currentCategory.name}
                  </h1>
                </div>
                {/* AdminControls for Category */}
                {user &&
                  (user.role === "admin" || user.role === "moderator") && (
                    <AdminControls
                      content={currentCategory as AdminControlsContentType}
                      contentType="category"
                      onDelete={() => router.push("/")}
                    />
                  )}
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {currentCategory.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                {currentCategory.region && (
                  <span>Region: {currentCategory.region}</span>
                )}
                {currentCategory.birth_year && (
                  <span>Birth Year: {currentCategory.birth_year}</span>
                )}
                {currentCategory.play_level && (
                  <span>Level: {currentCategory.play_level}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Conditional rendering for QuickTopicModal and CategoryRequestModal buttons */}
              {isLevel3Category || // If it's a level 3 category, allow posting
              (currentCategory.level === 2 &&
                !currentCategory.requires_moderation) ? ( // Or a level 2 that doesn't require moderation
                <>
                  {/* QuickTopicModal Trigger Button */}
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setQuickTopicModalOpen(true)} // Directly control modal state
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>

                  {/* CategoryRequestModal Trigger Button - now uses DialogTrigger */}

                  <CategoryRequestModal
                    isOpen={categoryRequestModalOpen}
                    onClose={() => setCategoryRequestModalOpen(false)}
                    initialParentCategoryId={currentCategory?.id}
                    trigger={
                      // Pass the button as a trigger
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        // REMOVED: onClick={() => setCategoryRequestModalOpen(true)}
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
                <div className="flex flex-col items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Browse Only - Select a{" "}
                    {currentCategory.slug?.includes("general")
                      ? "Category"
                      : currentCategory.slug?.includes("tournaments")
                      ? "Location"
                      : currentCategory.slug?.includes("usa") ||
                        currentCategory.region === "USA"
                      ? "State"
                      : "Province"}{" "}
                    to Post
                  </Badge>
                  {/* CategoryRequestModal Trigger Button - now uses DialogTrigger */}
                  <CategoryRequestModal
                    isOpen={categoryRequestModalOpen}
                    onClose={() => setCategoryRequestModalOpen(false)}
                    initialParentCategoryId={currentCategory?.id}
                    trigger={
                      // Pass the button as a trigger
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        // REMOVED: onClick={() => setCategoryRequestModalOpen(true)}
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
      {currentCategory && hasSubcategories ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Browse Categories
            </h2>
            <div className="text-xs sm:text-sm text-gray-500">
              Can't find what you're looking for?{" "}
              {/* CategoryRequestModal Trigger Button - now uses DialogTrigger */}
              <CategoryRequestModal
                isOpen={categoryRequestModalOpen}
                onClose={() => setCategoryRequestModalOpen(false)}
                initialParentCategoryId={currentCategory?.id}
                trigger={
                  // Pass the button as a trigger
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-blue-600 text-xs sm:text-sm"
                    // REMOVED: onClick={() => setCategoryRequestModalOpen(true)}
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
      ) : currentCategory ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Topics
            </h2>
          </div>
          <Card className="p-3 sm:p-6 w-full">
            {isLoadingTopics ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 sm:h-20 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : topicsData && topicsData.data.length > 0 ? (
              <div className="space-y-4">
                {topicsData.data.map((topic: HookTopic) => (
                  <PostCard
                    key={topic.id}
                    topic={
                      {
                        id: topic.id,
                        created_at: topic.created_at ?? null,
                        title: topic.title,
                        content: topic.content ?? null,
                        view_count: topic.view_count ?? null,
                        reply_count: topic.reply_count ?? null,
                        last_reply_at: topic.last_reply_at ?? null,
                        author_id: topic.author_id ?? null,
                        category_id: topic.category_id,
                        is_locked: topic.is_locked ?? null,
                        is_pinned: topic.is_pinned ?? null,
                        is_hidden: topic.is_hidden ?? null,
                        slug: topic.slug ?? null,
                        hot_score: topic.hot_score ?? null,
                        last_post_id: topic.last_post_id ?? null,
                        moderation_status: topic.moderation_status ?? null,
                        username: topic.profiles?.username ?? null,
                        avatar_url: topic.profiles?.avatar_url ?? null,
                        category_name: topic.categories?.name ?? null,
                        category_color: topic.categories?.color ?? null,
                        category_slug: topic.categories?.slug ?? null,
                        parent_category_id:
                          topic.categories?.parent_category_id ?? null,
                        parent_category_slug: null,
                        updated_at: topic.updated_at ?? null,
                      } as PostCardTopic
                    }
                    onReport={handleReportTopic}
                  />
                ))}
                <PaginationControls
                  currentPage={topicsData.currentPage}
                  totalPages={topicsData.totalPages}
                  totalItems={topicsData.totalCount}
                  itemsPerPage={10}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="base sm:text-lg font-semibold text-gray-900 mb-2">
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

      {/* Quick Topic Modal */}
      <QuickTopicModal
        isOpen={quickTopicModalOpen}
        onClose={() => setQuickTopicModalOpen(false)}
        preselectedCategoryId={currentCategory?.id} // Ensure currentCategory is not null
      />

      {/* Category Request Modal */}
      <CategoryRequestModal
        isOpen={categoryRequestModalOpen}
        onClose={() => setCategoryRequestModalOpen(false)}
        initialParentCategoryId={currentCategory?.id} // Ensure currentCategory is not null
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
        topicId={reportModal.topicId}
        contentType="topic"
      />
    </div>
  );
};
