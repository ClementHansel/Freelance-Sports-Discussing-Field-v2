// src/components/forum/category/Category.tsx
"use client";

import React, { useState, useEffect } from "react"; //
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

// Import canonical Category type from useCategories
import {
  useCategories, // Keep useCategories for allCategoriesForBreadcrumbs
  Category, // This is the canonical Category type
} from "@/hooks/useCategories"; //
// CORRECTED: Import useCategoryBySlug from its specific file for hierarchical logic
import { useCategoryBySlug } from "@/hooks/useCategoryBySlug"; //
import {
  useTopics, //
  PaginatedTopicsResult, //
  Topic as HookTopic, // Alias to avoid conflict if 'Topic' is used locally
} from "@/hooks/useTopics"; //
import {
  useCategoriesByActivity, //
  CategoryWithActivity, //
} from "@/hooks/useCategoriesByActivity"; //
import { useAuth } from "@/hooks/useAuth"; //
import { useCategoryStats } from "@/hooks/useCategoryStats"; //
import { useForumSettings, ForumSettingsMap } from "@/hooks/useForumSettings"; //
import { formatDistanceToNow } from "date-fns"; //
import { QuickTopicModal } from "@/components/forum/QuickTopicModal"; //
import { CategoryRequestModal } from "@/components/forum/category/CategoryRequestModal"; //

import {
  Breadcrumb, //
  BreadcrumbEllipsis, // Keep if you use ellipsis for long breadcrumbs
  BreadcrumbItem, //
  BreadcrumbLink, //
  BreadcrumbList, //
  BreadcrumbPage, //
  BreadcrumbSeparator, //
} from "@/components/ui/breadcrumb"; //
import { PostCard, PostCardTopic } from "@/components/forum/PostCard"; // Ensure PostCardTopic is exported from PostCard.tsx
import { PaginationControls } from "@/components/ui/pagination-controls"; // Ensure this component is exported
import { ReportModal } from "@/components/forum/ReportModal"; // Ensure this component is exported

// Import specific types for AdminControls content
// These should be the types that AdminControls expects for its 'content' prop
import { Topic as AdminTopicInfoTopic } from "@/components/forum/category/AdminTopicInfo"; //
// CORRECTED: Import Post from AdminPostInfo.tsx
import { Post as AdminPostInfoPost } from "@/components/forum/category/AdminPostInfo"; //
// No longer need to import Post from '@/hooks/usePosts' directly for AdminControlsContentType
// import { Post } from "@/hooks/usePosts";
import { AdminControls } from "./AdminControls"; //

// Define the ContentType for AdminControls
// This union type ensures that AdminControls can accept Category, Topic, or AdminPostInfoPost
type AdminControlsContentType =
  | AdminPostInfoPost
  | AdminTopicInfoTopic
  | Category; //

// Define props interface for Category client component
interface CategoryClientProps {
  initialCategory?: Category; //
  initialTopics?: PaginatedTopicsResult; //
  initialSubcategories?: CategoryWithActivity[]; //
  initialForumSettings?: ForumSettingsMap; //
  categorySlug: string; //
  currentPage: number; //
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

    // Find the parent category from the provided list
    current = allPossibleCategories?.find(
      (cat) => cat.id === current?.parent_category_id
    );
  }
  return breadcrumbs;
};

// SubcategoryCard now expects CategoryWithActivity
const SubcategoryCard = ({ subcat }: { subcat: CategoryWithActivity }) => {
  // useCategoryStats is still here as a fallback if topic_count/post_count
  // from useCategoriesByActivity are null/undefined, as per your RPC.
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

export default function CategoryClientComponent({
  initialCategory,
  initialTopics,
  initialSubcategories,
  initialForumSettings,
  categorySlug: propCategorySlug,
  currentPage: propCurrentPage,
}: CategoryClientProps) {
  const params = useParams(); //
  const router = useRouter(); //
  const searchParams = useSearchParams(); //

  const currentCategorySlug =
    propCategorySlug || (params.categorySlug as string); //
  const subcategorySlug = params.subcategorySlug as string | undefined; // Ensure subcategorySlug is correctly typed from params

  const { user } = useAuth(); //

  const [activeTab, setActiveTab] = useState(searchParams.get("sort") || "new"); //
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || propCurrentPage || 1
  ); //
  const [quickTopicModalOpen, setQuickTopicModalOpen] = useState(false); //
  const [categoryRequestModalOpen, setCategoryRequestModalOpen] =
    useState(false); //
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    topicId?: string;
  }>({ isOpen: false }); //

  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryBySlug({
    categorySlug: currentCategorySlug, // Pass main slug
    subcategorySlug: subcategorySlug, // Pass subcategory slug if present
    initialData: initialCategory ?? null, // Now accepts null
    enabled: !!currentCategorySlug, // Enable if main slug is present
  }); //

  const { data: topicsData, isLoading: topicsLoading } = useTopics({
    categoryId: categoryData?.id, //
    page: currentPage, //
    limit: 10, //
    orderBy: activeTab === "hot" ? "hot_score" : "created_at", //
    ascending: activeTab === "new" ? false : false, //
    initialData: initialTopics ?? undefined, // Use ?? undefined
    enabled: !!categoryData?.id, //
  }); //

  const { data: subcategoriesData, isLoading: subcategoriesLoading } =
    useCategoriesByActivity({
      parentId: categoryData?.id, //
      initialData: initialSubcategories ?? undefined, // Use ?? undefined
      enabled: !!categoryData?.id, //
    }); //

  const { data: allCategoriesForBreadcrumbs, isLoading: allCategoriesLoading } =
    useCategories({
      enabled: !!categoryData, //
    }); //

  const { settings: forumSettings, isLoading: settingsLoading } =
    useForumSettings({
      initialData: initialForumSettings ?? undefined, // Use ?? undefined
    }); //

  const isLoading =
    categoryLoading ||
    topicsLoading ||
    subcategoriesLoading ||
    settingsLoading ||
    allCategoriesLoading; //

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString()); //
    if (activeTab !== "new") {
      params.set("sort", activeTab); //
    } else {
      params.delete("sort"); //
    }
    if (currentPage !== 1) {
      params.set("page", currentPage.toString()); //
    } else {
      params.delete("page"); //
    }
    router.replace(`?${params.toString()}`, { scroll: false }); //
  }, [activeTab, currentPage, router, searchParams]); //

  const handlePageChange = (page: number) => {
    setCurrentPage(page); //
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value); //
    setCurrentPage(1); //
  };

  const handleReportTopic = (topicId: string) => {
    setReportModal({ isOpen: true, topicId }); //
  };

  // CORRECTED: Compare with boolean true
  const canCreateTopic =
    user ||
    (forumSettings?.["anonymous_posting_enabled"]?.value === true && //
      forumSettings?.["anonymous_topic_creation_enabled"]?.value === true); //

  const [displayBreadcrumbs, setDisplayBreadcrumbs] = useState<
    {
      name: string;
      slug: string;
      id: string;
      href: string;
      isCurrent?: boolean;
    }[]
  >([]); //

  useEffect(() => {
    if (categoryData && allCategoriesForBreadcrumbs) {
      const built = buildBreadcrumbHierarchy(
        categoryData,
        allCategoriesForBreadcrumbs
      ); //
      // Map the built hierarchy to include `href` and `isCurrent`
      const finalBreadcrumbs = built.map((crumb, idx) => ({
        ...crumb,
        href: `/category/${crumb.slug}`, // Default href
        isCurrent: idx === built.length - 1, //
      })); //

      // Adjust href for hierarchical paths if needed
      if (categoryData.level === 3 && subcategorySlug) {
        const parent2 = allCategoriesForBreadcrumbs.find(
          (cat) => cat.id === categoryData.parent_category_id
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
      } else if (categoryData.level === 2 && categoryData.parent_category_id) {
        const parent1 = allCategoriesForBreadcrumbs.find(
          (cat) => cat.id === categoryData.parent_category_id
        ); //
        if (parent1) {
          finalBreadcrumbs[0].href = `/category/${parent1.slug}`; //
        }
      }
      setDisplayBreadcrumbs(finalBreadcrumbs); //
    } else if (categoryData) {
      // Fallback for single-level category if allCategoriesForBreadcrumbs is not ready
      setDisplayBreadcrumbs([
        {
          name: categoryData.name,
          slug: categoryData.slug,
          id: categoryData.id,
          href: `/category/${categoryData.slug}`,
          isCurrent: true,
        },
      ]); //
    }
  }, [categoryData, allCategoriesForBreadcrumbs, subcategorySlug]); //

  if (isLoading) {
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

  if (!categoryData && !isLoading) {
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

  const hasSubcategories = subcategoriesData && subcategoriesData.length > 0; //
  const isLevel3Category = categoryData?.level === 3; // Use categoryData here

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Breadcrumb */}
      {categoryData && (
        <Breadcrumb className="overflow-x-auto">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {displayBreadcrumbs.map((crumb, index) => (
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
      {categoryData && (
        <Card className="p-4 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryData.color ?? "" }}
                  />
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 truncate">
                    {categoryData.name}
                  </h1>
                </div>
                {/* AdminControls for Category */}
                {user &&
                  (user.role === "admin" || user.role === "moderator") && (
                    <AdminControls
                      content={categoryData as AdminControlsContentType}
                      contentType="category"
                      onDelete={() => router.push("/")}
                    />
                  )}
              </div>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {categoryData.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                {categoryData.region && (
                  <span>Region: {categoryData.region}</span>
                )}
                {categoryData.birth_year && (
                  <span>Birth Year: {categoryData.birth_year}</span>
                )}
                {categoryData.play_level && (
                  <span>Level: {categoryData.play_level}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Conditional rendering for QuickTopicModal and CategoryRequestModal buttons */}
              {isLevel3Category || // If it's a level 3 category, allow posting
              (categoryData.level === 2 &&
                !categoryData.requires_moderation) ? ( // Or a level 2 that doesn't require moderation
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
                    initialParentCategoryId={categoryData?.id} // Use categoryData here
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
                    {categoryData.slug?.includes("general")
                      ? "Category"
                      : categoryData.slug?.includes("tournaments")
                      ? "Location"
                      : categoryData.slug?.includes("usa") ||
                        categoryData.region === "USA"
                      ? "State"
                      : "Province"}{" "}
                    to Post
                  </Badge>
                  {/* CategoryRequestModal Trigger Button - now uses DialogTrigger */}

                  <CategoryRequestModal
                    isOpen={categoryRequestModalOpen}
                    onClose={() => setCategoryRequestModalOpen(false)}
                    initialParentCategoryId={categoryData?.id} // Use categoryData here
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
      {categoryData && hasSubcategories ? ( // Use categoryData here
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
                initialParentCategoryId={categoryData?.id} // Use categoryData here
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
            {subcategoriesData!.map((subcat) => (
              <SubcategoryCard key={subcat.id} subcat={subcat} />
            ))}
          </div>
        </>
      ) : categoryData ? ( // Use categoryData here
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Topics
            </h2>
          </div>
          <Card className="p-3 sm:p-6 w-full">
            {topicsLoading ? ( // Corrected variable name
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
        preselectedCategoryId={categoryData?.id} // Use categoryData here
      />

      {/* Category Request Modal */}
      <CategoryRequestModal
        isOpen={categoryRequestModalOpen}
        onClose={() => setCategoryRequestModalOpen(false)}
        initialParentCategoryId={categoryData?.id} // Use categoryData here
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
}
