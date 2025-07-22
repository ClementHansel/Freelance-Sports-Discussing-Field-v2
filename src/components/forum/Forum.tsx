"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// Import your Shadcn UI components (assuming paths are correct)
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import Lucide React icons
import {
  TrendingUp,
  Clock,
  Star,
  MessageSquare,
  User as UserIcon,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Eye,
} from "lucide-react";

// Import your custom hooks and components (ensure these files are also migrated and marked 'use client' if needed)
import { useHotTopics } from "@/hooks/useHotTopics";
import { useTopics } from "@/hooks/useTopics";
import { useHotTopicsLegacy } from "@/hooks/useHotTopicsLegacy"; // Check if this is still needed or if useHotTopics is enough
import { useMostCommentedTopics } from "@/hooks/useMostCommentedTopics";
import { useMostViewedTopics } from "@/hooks/useMostViewedTopics";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useForumSettings } from "@/hooks/useForumSettings";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { PostCard } from "@/components/forum/PostCard";
import { ReportModal } from "@/components/forum/ReportModal";
import { QuickTopicModal } from "@/components/forum/QuickTopicModal";
import { CategoryWithActivity } from "@/components/forum/category/CategoryRow";

import { Topic as UseTopicsTopic } from "@/hooks/useTopics";
import { HotTopic } from "@/hooks/useHotTopics";
// Define a local interface for HotTopic that includes `is_hidden` to resolve the type error
// This should ideally be updated in the `useHotTopics` hook's type definition.
interface HotTopicWithHidden extends HotTopic {
  // Correctly extends HotTopic
  is_hidden?: boolean | null;
}
type UseHotTopicsTopicExtended = HotTopicWithHidden; // Use this extended type for hot topics

import { MostCommentedTopic as UseMostCommentedTopic } from "@/hooks/useMostCommentedTopics"; // Import MostCommentedTopic
import { MostViewedTopic as UseMostViewedTopic } from "@/hooks/useMostViewedTopics"; // Import MostViewedTopic

// Align Forum type with CategoryWithActivity from CategoryRow.tsx
// This resolves the type incompatibility as useCategories is expected to return CategoryWithActivity[]
type Forum = CategoryWithActivity;

// Define the type for a group of forums (e.g., "Canada" or "USA" forums)
interface ForumGroup {
  name: string;
  forums: Forum[];
}

export default function Forum() {
  const { user } = useAuth();
  const { getSetting } = useForumSettings();
  const searchParams = useSearchParams(); // Correctly typed as URLSearchParams by Next.js
  const router = useRouter(); // Initialize useRouter

  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    topicId?: string;
  }>({
    isOpen: false,
  });

  // Pagination state for each tab
  const [hotPage, setHotPage] = useState(1);
  const [newPage, setNewPage] = useState(1);
  const [topPage, setTopPage] = useState(1); // State for 'top' topics pagination
  const [mostCommentedPage, setMostCommentedPage] = useState(1);
  const [mostViewedPage, setMostViewedPage] = useState(1);

  // Get current sort order from URL, default to 'hot'
  const currentSort = searchParams.get("sort") || "hot"; // `searchParams` is URLSearchParams

  // Fetch data for each tab
  const { data: hotTopicsData, isLoading: hotTopicsLoading } = useHotTopics(
    hotPage,
    10
  );
  const { data: newTopicsData, isLoading: newTopicsLoading } = useTopics(
    undefined,
    newPage,
    10,
    "created_at",
    false // Newest first
  );
  // Using useTopics for 'top' based on view_count
  const { data: topTopicsData, isLoading: topTopicsLoading } = useTopics(
    undefined,
    topPage,
    10,
    "view_count", // Order by view_count for 'top'
    false // Descending order (highest views first)
  );
  const { data: mostCommentedTopicsData, isLoading: mostCommentedLoading } =
    useMostCommentedTopics(mostCommentedPage, 10);
  const { data: mostViewedTopicsData, isLoading: mostViewedLoading } =
    useMostViewedTopics(mostViewedPage, 10);

  // Fetch categories for forum sections
  // Changed 'null' to 'undefined' for parent_category_id to fetch all categories at the given level
  const { data: level1Forums, isLoading: level1ForumsLoading } = useCategories(
    undefined, // Changed from null
    1
  ) as { data: CategoryWithActivity[] | undefined; isLoading: boolean };
  const { data: level2Forums, isLoading: level2ForumsLoading } = useCategories(
    undefined, // Changed from null
    2
  ) as { data: CategoryWithActivity[] | undefined; isLoading: boolean };

  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("sort", value);
    router.push(`/?${newSearchParams.toString()}`); // Use router.push to update URL
  };

  const handleReport = (topicId: string) => {
    setReportModal({ isOpen: true, topicId });
  };

  // Function to render grouped forums (kept for Main Forums section if needed, but not used for Province/State anymore)
  const renderGroupedForums = (forums: Forum[]) => {
    const grouped: { [key: string]: Forum[] } = {};

    forums.forEach((forum) => {
      const groupName = forum.region || "Other Regions"; // Group by region or a default
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(forum);
    });

    const sortedGroupNames = Object.keys(grouped).sort();

    return sortedGroupNames.map((groupName) => (
      <div key={groupName} className="space-y-3">
        <Suspense
          fallback={
            <Card className="p-6">
              <div className="text-center">Loading content...</div>
            </Card>
          }
        >
          <h3 className="lg font-semibold text-foreground">{groupName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped[groupName].map(
              (
                forum: Forum // Explicitly cast to Forum
              ) => (
                <Link
                  key={forum.id}
                  href={`/category/${forum.slug}`} // Use Next.js Link
                  className="group"
                >
                  <Card className="p-4 flex items-center space-x-3 hover:bg-muted/50 transition-colors">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: forum.color ?? "" }} // Added nullish coalescing
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {forum.name}
                      </h4>
                      {forum.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {forum.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            )}
          </div>
        </Suspense>
      </div>
    ));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header - Re-added missing section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getSetting("forum_name", "Minor Hockey Talks") as string}
        </h1>
        <p className="text-muted-foreground">
          {
            getSetting(
              "forum_description",
              "A community forum for minor hockey discussions"
            ) as string
          }
        </p>
      </div>

      {/* Social Media Links */}
      <div className="flex justify-center space-x-6 py-4">
        {(() => {
          const facebookUrl = getSetting("social_facebook", "");
          const cleanUrl =
            typeof facebookUrl === "string"
              ? facebookUrl.replace(/^"(.*)"$/, "$1")
              : "";
          return (
            cleanUrl &&
            cleanUrl !== "" && (
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook" // Add aria-label for accessibility
              >
                <Facebook className="h-6 w-6" />
              </a>
            )
          );
        })()}
        {(() => {
          const twitterUrl = getSetting("social_twitter", "");
          const cleanUrl =
            typeof twitterUrl === "string"
              ? twitterUrl.replace(/^"(.*)"$/, "$1")
              : "";
          return (
            cleanUrl &&
            cleanUrl !== "" && (
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter" // Add aria-label for accessibility
              >
                <Twitter className="h-6 w-6" />
              </a>
            )
          );
        })()}
        {(() => {
          const instagramUrl = getSetting("social_instagram", "");
          const cleanUrl =
            typeof instagramUrl === "string"
              ? instagramUrl.replace(/^"(.*)"$/, "$1")
              : "";
          return (
            cleanUrl &&
            cleanUrl !== "" && (
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram" // Add aria-label for accessibility
              >
                <Instagram className="h-6 w-6" />
              </a>
            )
          );
        })()}
        {(() => {
          const youtubeUrl = getSetting("social_youtube", "");
          const cleanUrl =
            typeof youtubeUrl === "string"
              ? youtubeUrl.replace(/^"(.*)"$/, "$1")
              : "";
          return (
            cleanUrl &&
            cleanUrl !== "" && (
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Youtube" // Add aria-label for accessibility
              >
                <Youtube className="h-6 w-6" />
              </a>
            )
          );
        })()}
      </div>

      {/* Quick Topic Button */}
      {user && (
        <div className="flex justify-end mb-4">
          <QuickTopicModal />
        </div>
      )}

      {/* Hot Topics / New Posts / Top Posts Tabs */}
      <div className="space-y-4">
        <Tabs value={currentSort} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5">
            <TabsTrigger value="hot">
              <TrendingUp className="h-4 w-4 mr-2" /> Hot
            </TabsTrigger>
            <TabsTrigger value="new">
              <Clock className="h-4 w-4 mr-2" /> New
            </TabsTrigger>
            <TabsTrigger value="top">
              <Star className="h-4 w-4 mr-2" /> Top
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" /> Comments
            </TabsTrigger>
            <TabsTrigger value="views">
              <Eye className="h-4 w-4 mr-2" /> Views
            </TabsTrigger>
          </TabsList>

          {/* Hot Topics Tab */}
          <TabsContent value="hot" className="space-y-4">
            {hotTopicsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : hotTopicsData && hotTopicsData.data.length > 0 ? (
              <>
                <div className="space-y-4">
                  {hotTopicsData.data.map(
                    (
                      topic: UseHotTopicsTopicExtended // Use the extended type here
                    ) => (
                      <PostCard
                        key={topic.id}
                        topic={{
                          id: topic.id,
                          created_at: topic.created_at ?? null,
                          title: topic.title,
                          content: topic.content ?? null,
                          view_count: topic.view_count ?? null,
                          reply_count: topic.reply_count ?? null,
                          last_reply_at: topic.last_reply_at ?? null, // Corrected property name
                          author_id: topic.author_id ?? null,
                          category_id: topic.category_id,
                          is_locked: topic.is_locked ?? null,
                          is_pinned: topic.is_pinned ?? null,
                          is_hidden: topic.is_hidden ?? null, // Now properly typed in HotTopicWithHidden
                          slug: topic.slug ?? null,
                          hot_score: topic.hot_score ?? null,
                          last_post_id: topic.last_post_id ?? null,
                          parent_category_id: topic.parent_category_id ?? null,
                          parent_category_slug:
                            topic.parent_category_slug ?? null,
                          username: topic.username ?? null,
                          avatar_url: topic.avatar_url ?? null,
                          category_name: topic.category_name ?? null,
                          category_color: topic.category_color ?? null,
                          category_slug: topic.category_slug ?? null,
                          updated_at: topic.updated_at ?? null,
                        }}
                        onReport={handleReport}
                      />
                    )
                  )}
                </div>
                <PaginationControls
                  currentPage={hotPage}
                  totalPages={hotTopicsData.totalPages}
                  totalItems={hotTopicsData.totalCount}
                  itemsPerPage={10}
                  onPageChange={setHotPage}
                  loading={hotTopicsLoading}
                />
              </>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hot topics</h3>
                <p className="text-muted-foreground">
                  Check back later for trending discussions!
                </p>
              </Card>
            )}
          </TabsContent>

          {/* New Posts Tab */}
          <TabsContent value="new" className="space-y-4">
            {newTopicsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : newTopicsData && newTopicsData.data.length > 0 ? (
              <>
                <div className="space-y-4">
                  {newTopicsData.data.map((topic: UseTopicsTopic) => (
                    <PostCard
                      key={topic.id}
                      topic={{
                        id: topic.id,
                        created_at: topic.created_at ?? null,
                        title: topic.title,
                        content: topic.content ?? null,
                        view_count: topic.view_count ?? null,
                        reply_count: topic.reply_count ?? null,
                        author_id: topic.author_id ?? null,
                        category_id: topic.category_id,
                        is_locked: topic.is_locked ?? null,
                        is_pinned: topic.is_pinned ?? null,
                        is_hidden: topic.is_hidden ?? null, // Explicitly set
                        username: topic.profiles?.username ?? null,
                        avatar_url: topic.profiles?.avatar_url ?? null,
                        category_name: topic.categories?.name ?? null,
                        category_color: topic.categories?.color ?? null,
                        category_slug: topic.categories?.slug ?? null,
                        slug: topic.slug ?? null,
                        hot_score: topic.hot_score ?? null,
                        last_post_id: topic.last_post_id ?? null,
                        parent_category_id:
                          topic.categories?.parent_category_id ?? null,
                        parent_category_slug: null, // Not directly available from useTopics, set to null
                        last_reply_at: topic.last_reply_at ?? null, // Keep only one instance
                        updated_at: topic.updated_at ?? null,
                      }}
                      onReport={handleReport}
                    />
                  ))}
                </div>
                <PaginationControls
                  currentPage={newPage}
                  totalPages={newTopicsData.totalPages}
                  totalItems={newTopicsData.totalCount}
                  itemsPerPage={10}
                  onPageChange={setNewPage}
                  loading={newTopicsLoading}
                />
              </>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to start a discussion!
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Top Topics Tab */}
          <TabsContent value="top" className="space-y-4">
            {topTopicsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : topTopicsData && topTopicsData.data.length > 0 ? (
              <>
                <div className="space-y-4">
                  {topTopicsData.data.map((topic: UseTopicsTopic) => (
                    <PostCard
                      key={topic.id}
                      topic={{
                        id: topic.id,
                        created_at: topic.created_at ?? null,
                        title: topic.title,
                        content: topic.content ?? null,
                        view_count: topic.view_count ?? null,
                        reply_count: topic.reply_count ?? null,
                        author_id: topic.author_id ?? null,
                        category_id: topic.category_id,
                        is_locked: topic.is_locked ?? null,
                        is_pinned: topic.is_pinned ?? null,
                        is_hidden: topic.is_hidden ?? null,
                        username: topic.profiles?.username ?? null,
                        avatar_url: topic.profiles?.avatar_url ?? null,
                        category_name: topic.categories?.name ?? null,
                        category_color: topic.categories?.color ?? null,
                        category_slug: topic.categories?.slug ?? null,
                        slug: topic.slug ?? null,
                        hot_score: topic.hot_score ?? null,
                        last_post_id: topic.last_post_id ?? null,
                        parent_category_id:
                          topic.categories?.parent_category_id ?? null,
                        parent_category_slug: null,
                        last_reply_at: topic.last_reply_at ?? null,
                        updated_at: topic.updated_at ?? null,
                      }}
                      onReport={handleReport}
                    />
                  ))}
                </div>
                <PaginationControls
                  currentPage={topPage}
                  totalPages={topTopicsData.totalPages}
                  totalItems={topTopicsData.totalCount}
                  itemsPerPage={10}
                  onPageChange={setTopPage}
                  loading={topTopicsLoading}
                />
              </>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No top topics</h3>
                <p className="text-muted-foreground">
                  No topics with significant views yet.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Most Commented Topics Tab */}
          <TabsContent value="comments" className="space-y-4">
            {mostCommentedLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : mostCommentedTopicsData &&
              mostCommentedTopicsData.data.length > 0 ? (
              <>
                <div className="space-y-4">
                  {mostCommentedTopicsData.data.map(
                    (topic: UseMostCommentedTopic) => (
                      <PostCard
                        key={topic.id}
                        topic={{
                          id: topic.id,
                          created_at: topic.created_at ?? null,
                          title: topic.title,
                          content: topic.content ?? null,
                          view_count: topic.view_count ?? null,
                          reply_count: topic.reply_count ?? null,
                          last_reply_at: topic.last_reply_at ?? null, // Corrected property name
                          author_id: topic.author_id ?? null,
                          category_id: topic.category_id,
                          is_locked: topic.is_locked ?? null,
                          is_pinned: topic.is_pinned ?? null,
                          is_hidden: null, // Explicitly set to null as it's not present in MostCommentedTopic
                          slug: topic.slug ?? null,
                          hot_score: null, // Explicitly set to null as it's not present in MostCommentedTopic
                          last_post_id: topic.last_post_id ?? null,
                          parent_category_id: topic.parent_category_id ?? null,
                          parent_category_slug:
                            topic.parent_category_slug ?? null,
                          username: topic.username ?? null,
                          avatar_url: topic.avatar_url ?? null,
                          category_name: topic.category_name ?? null,
                          category_color: topic.category_color ?? null,
                          category_slug: topic.category_slug ?? null,
                          updated_at: topic.updated_at ?? null,
                        }}
                        onReport={handleReport}
                      />
                    )
                  )}
                </div>
                <PaginationControls
                  currentPage={mostCommentedPage}
                  totalPages={mostCommentedTopicsData.totalPages}
                  totalItems={mostCommentedTopicsData.totalCount}
                  itemsPerPage={10}
                  onPageChange={setMostCommentedPage}
                  loading={mostCommentedLoading}
                />
              </>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No most commented topics
                </h3>
                <p className="text-muted-foreground">
                  Start a lively discussion!
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Most Viewed Topics Tab */}
          <TabsContent value="views" className="space-y-4">
            {mostViewedLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : mostViewedTopicsData && mostViewedTopicsData.data.length > 0 ? (
              <>
                <div className="space-y-4">
                  {mostViewedTopicsData.data.map(
                    (topic: UseMostViewedTopic) => (
                      <PostCard
                        key={topic.id}
                        topic={{
                          id: topic.id,
                          created_at: topic.created_at ?? null,
                          title: topic.title,
                          content: topic.content ?? null,
                          view_count: topic.view_count ?? null,
                          reply_count: topic.reply_count ?? null,
                          last_reply_at: topic.last_reply_at ?? null, // Corrected property name
                          author_id: topic.author_id ?? null,
                          category_id: topic.category_id,
                          is_locked: topic.is_locked ?? null,
                          is_pinned: topic.is_pinned ?? null,
                          is_hidden: null, // Explicitly set to null as it's not present in MostViewedTopic
                          slug: topic.slug ?? null,
                          hot_score: null, // Explicitly set to null as it's not present in MostViewedTopic
                          last_post_id: topic.last_post_id ?? null,
                          parent_category_id: topic.parent_category_id ?? null,
                          parent_category_slug:
                            topic.parent_category_slug ?? null,
                          username: topic.username ?? null,
                          avatar_url: topic.avatar_url ?? null,
                          category_name: topic.category_name ?? null,
                          category_color: topic.category_color ?? null,
                          category_slug: topic.category_slug ?? null,
                          updated_at: topic.updated_at ?? null,
                        }}
                        onReport={handleReport}
                      />
                    )
                  )}
                </div>
                <PaginationControls
                  currentPage={mostViewedPage}
                  totalPages={mostViewedTopicsData.totalPages}
                  totalItems={mostViewedTopicsData.totalCount}
                  itemsPerPage={10}
                  onPageChange={setMostViewedPage}
                  loading={mostViewedLoading}
                />
              </>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No most viewed topics
                </h3>
                <p className="text-muted-foreground">
                  Be the first to get views!
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Forums Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Main Forums</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">View All</Link>
          </Button>
        </div>

        {level1ForumsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 h-24 animate-pulse bg-muted" />
            ))}
          </div>
        ) : level1Forums && level1Forums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {level1Forums.map(
              (
                forum: Forum // Explicitly cast to Forum
              ) => (
                <Link
                  key={forum.id}
                  href={`/category/${forum.slug}`}
                  className="group"
                >
                  <Card className="p-4 flex items-center space-x-3 hover:bg-muted/50 transition-colors">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: forum.color ?? "" }} // Added nullish coalescing
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {forum.name}
                      </h4>
                      {forum.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {forum.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            )}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No forums available</h3>
            <p className="text-muted-foreground">
              Forums will appear here once they are created.
            </p>
          </Card>
        )}
      </div>

      {/* Province/State Forums Section - UPDATED LOGIC */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Browse Province / State Forums
          </h2>
        </div>

        {level2ForumsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 h-24 animate-pulse bg-muted" />
            ))}
          </div>
        ) : level2Forums && level2Forums.length > 0 ? (
          <div className="space-y-6">
            {(() => {
              // Filter out tournament forums and group by country using parent_category_id
              // IMPORTANT: Replace these placeholder UUIDs with the actual IDs from your Supabase 'categories' table
              // for your "Canada" and "USA" parent categories.
              const CANADA_PARENT_CATEGORY_ID =
                "11111111-1111-1111-1111-111111111111"; // e.g., 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
              const USA_PARENT_CATEGORY_ID =
                "22222222-2222-2222-2222-222222222222"; // e.g., 'b2c3d4e5-f6a7-8901-2345-67890abcdef0'

              const canadianForums = level2Forums
                .filter(
                  (forum) =>
                    forum.parent_category_id === CANADA_PARENT_CATEGORY_ID
                )
                .sort((a, b) => (a.region || "").localeCompare(b.region || ""));

              const usaForums = level2Forums
                .filter(
                  (forum) => forum.parent_category_id === USA_PARENT_CATEGORY_ID
                )
                .sort((a, b) => (a.region || "").localeCompare(b.region || ""));

              const countries: ForumGroup[] = [];
              if (canadianForums.length > 0) {
                countries.push({ name: "Canada", forums: canadianForums });
              }
              if (usaForums.length > 0) {
                countries.push({ name: "USA", forums: usaForums });
              }

              return countries.map((country) => (
                <div key={country.name} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    {country.name}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {country.forums.map((forum) => (
                      <Link
                        key={forum.id}
                        href={`/category/${forum.slug}`} // Use Next.js Link
                        className="block"
                      >
                        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center space-x-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: forum.color ?? "" }} // Added nullish coalescing
                            />
                            <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {forum.region}
                            </h4>
                          </div>
                          {forum.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {forum.description}
                            </p>
                          )}
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No province/state forums available
            </h3>
            <p className="text-muted-foreground">
              Province and state forums will appear here once they are created.
            </p>
          </Card>
        )}
      </div>

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
