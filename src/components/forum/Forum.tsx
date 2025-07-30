// src/components/forum/Forum.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// Import your Shadcn UI components
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

// Import your custom hooks and components
import {
  useHotTopics,
  PaginatedHotTopicsResult,
  HotTopic,
} from "@/hooks/useHotTopics";
import { useTopics, PaginatedTopicsResult, Topic } from "@/hooks/useTopics";
import { useAuth } from "@/hooks/useAuth";
import { useCategories, Category } from "@/hooks/useCategories";
import { useForumSettings, ForumSettingsMap } from "@/hooks/useForumSettings";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { PostCard } from "@/components/forum/PostCard";
import { ReportModal } from "@/components/forum/ReportModal";
import { QuickTopicModal } from "@/components/forum/QuickTopicModal";

// Define props interface for Forum component
interface ForumProps {
  initialHotTopics?: PaginatedHotTopicsResult;
  initialNewTopics?: PaginatedTopicsResult;
  initialTopTopics?: PaginatedTopicsResult;
  initialLevel1Forums?: Category[];
  initialLevel2Forums?: Category[];
  initialLevel3Forums?: Category[];
  initialForumSettings?: ForumSettingsMap;
}

// Define the structure that PostCard expects (flattened from Topic/HotTopic)
interface PostCardTopic {
  id: string;
  created_at: string | null;
  title: string;
  content: string | null;
  view_count: number | null;
  reply_count: number | null;
  last_reply_at: string | null;
  author_id: string | null;
  category_id: string;
  is_locked: boolean | null;
  is_pinned: boolean | null;
  is_hidden: boolean | null;
  slug: string | null;
  hot_score: number | null;
  last_post_id: string | null;
  parent_category_id: string | null;
  parent_category_slug: string | null;
  username: string | null;
  avatar_url: string | null;
  category_name: string | null;
  category_color: string | null;
  category_slug: string | null;
  updated_at: string | null;
  moderation_status: "approved" | "pending" | "rejected" | null;
}

export default function Forum({
  initialHotTopics,
  initialNewTopics,
  initialTopTopics,
  initialLevel1Forums,
  initialLevel2Forums,
  initialLevel3Forums,
  initialForumSettings,
}: ForumProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(searchParams.get("sort") || "new");
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [quickTopicModalOpen, setQuickTopicModalOpen] = useState(false);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    topicId?: string;
  }>({ isOpen: false });

  // Pass initialData to hooks using an options object
  const { data: hotTopicsData, isLoading: isLoadingHot } = useHotTopics({
    page: activeTab === "hot" ? currentPage : 1, // page
    limit: 10, // limit
    initialData: initialHotTopics, // initialData
  });

  const { data: newTopicsData, isLoading: isLoadingNew } = useTopics({
    page: activeTab === "new" ? currentPage : 1,
    orderBy: "created_at",
    ascending: false,
    initialData: initialNewTopics,
  });

  const { data: topTopicsData, isLoading: isLoadingTop } = useTopics({
    page: activeTab === "top" ? currentPage : 1,
    orderBy: "view_count",
    ascending: false,
    initialData: initialTopTopics,
  });

  const { data: level1Forums, isLoading: isLoadingLevel1 } = useCategories({
    level: 1,
    initialData: initialLevel1Forums,
  });
  const { data: level2Forums, isLoading: isLoadingLevel2 } = useCategories({
    level: 2,
    initialData: initialLevel2Forums,
  });
  const { data: level3Forums, isLoading: isLoadingLevel3 } = useCategories({
    level: 3,
    initialData: initialLevel3Forums,
  });

  const { settings: forumSettings, isLoading: isLoadingSettings } =
    useForumSettings({
      initialData: initialForumSettings,
    });

  // Determine which topics to display based on activeTab
  const currentTopics =
    activeTab === "new"
      ? hotTopicsData
      : activeTab === "new"
      ? newTopicsData
      : topTopicsData;

  const isLoading =
    isLoadingHot ||
    isLoadingNew ||
    isLoadingTop ||
    isLoadingLevel1 ||
    isLoadingLevel2 ||
    isLoadingLevel3 ||
    isLoadingSettings;

  // Update URL search params when tab or page changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeTab !== "new") {
      params.set("sort", activeTab);
    } else {
      params.delete("sort");
    }
    if (currentPage !== 1) {
      params.set("page", currentPage.toString());
    } else {
      params.delete("page");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeTab, currentPage, router, searchParams]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset page when changing tabs
  };

  const handleReportTopic = (topicId: string) => {
    setReportModal({ isOpen: true, topicId });
  };

  // Safely access settings values, providing fallbacks
  const advertisingEnabled =
    (forumSettings?.["advertising_enabled"]?.value as string) === "true";

  const forumName =
    (forumSettings?.["forum_name"]?.value as string) || "Minor Hockey Talks";
  const forumDescription =
    (forumSettings?.["forum_description"]?.value as string) ||
    "A community forum for minor hockey discussions";
  const socialFacebook =
    (forumSettings?.["social_facebook"]?.value as string) || "";
  const socialTwitter =
    (forumSettings?.["social_twitter"]?.value as string) || "";
  const socialInstagram =
    (forumSettings?.["social_instagram"]?.value as string) || "";
  const socialYoutube =
    (forumSettings?.["social_youtube"]?.value as string) || "";

  const renderGroupedForums = (forums: Category[]) => {
    const grouped: { [key: string]: Category[] } = {};

    forums.forEach((forum) => {
      const groupName = forum.region || "Other Regions";
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(forum);
    });

    const sortedGroupNames = Object.keys(grouped).sort();

    return sortedGroupNames.map((groupName) => (
      <div key={groupName} className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{groupName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grouped[groupName].map((forum: Category) => (
            <Link
              key={forum.id}
              href={`/category/${forum.slug}`}
              className="group"
            >
              <Card className="p-4 flex items-center space-x-3 hover:bg-muted/50 transition-colors">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: forum.color ?? "" }}
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
          ))}
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading forum...</div>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {forumName}
        </h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
          {forumDescription}
        </p>
      </div>
      <span className="flex justify-center text-sm md:text-base text-foreground leading-relaxed">
        Follow us
      </span>
      {/* Social Media Links */}
      <div className="flex justify-center gap-6 pb-4">
        {socialFacebook && (
          <a
            href={socialFacebook}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform duration-200"
            aria-label="Facebook"
          >
            <Facebook className="h-6 w-6" />
          </a>
        )}
        {socialTwitter && (
          <a
            href={socialTwitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform duration-200"
            aria-label="Twitter"
          >
            <Twitter className="h-6 w-6" />
          </a>
        )}
        {socialInstagram && (
          <a
            href={socialInstagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform duration-200"
            aria-label="Instagram"
          >
            <Instagram className="h-6 w-6" />
          </a>
        )}
        {socialYoutube && (
          <a
            href={socialYoutube}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 transform duration-200"
            aria-label="YouTube"
          >
            <Youtube className="h-6 w-6" />
          </a>
        )}
      </div>

      {/* Quick Topic / New Post Button - Always render */}
      <div className="flex justify-end mb-4">
        {/* The Button directly controls the state, no DialogTrigger needed here */}
        <Button size="default" onClick={() => setQuickTopicModalOpen(true)}>
          <MessageSquare className="h-5 w-5" />
          New Topic
        </Button>
      </div>

      {/* QuickTopicModal - now directly controlled by isOpen/onClose */}
      <QuickTopicModal
        isOpen={quickTopicModalOpen}
        onClose={() => setQuickTopicModalOpen(false)}
      />

      {/* Tabs for Hot / New / Top Topics */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-muted rounded-xl p-1 shadow-inner">
          <TabsTrigger
            value="new"
            className="text-sm font-semibold rounded-lg px-3 py-2 transition-all hover:bg-primary/90 hover:text-white data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Clock className="mr-2 h-4 w-4" /> New
          </TabsTrigger>
          <TabsTrigger
            value="hot"
            className="text-sm font-semibold rounded-lg px-3 py-2 transition-all hover:bg-primary/90 hover:text-white data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <TrendingUp className="mr-2 h-4 w-4" /> Hot
          </TabsTrigger>

          <TabsTrigger
            value="top"
            className="text-sm font-semibold rounded-lg px-3 py-2 transition-all hover:bg-primary/90 hover:text-white data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Star className="mr-2 h-4 w-4" /> Top
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hot" className="mt-6">
          {hotTopicsData?.data && hotTopicsData.data.length > 0 ? (
            <div className="space-y-4">
              {hotTopicsData.data.map((topic: HotTopic) => (
                <PostCard
                  key={topic.id}
                  topic={topic} // HotTopic should now be compatible
                  onReport={handleReportTopic}
                />
              ))}
              <PaginationControls
                currentPage={hotTopicsData.currentPage}
                totalPages={hotTopicsData.totalPages}
                totalItems={hotTopicsData.totalCount}
                itemsPerPage={10}
                onPageChange={handlePageChange}
              />
            </div>
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

        <TabsContent value="new" className="mt-6">
          {newTopicsData?.data && newTopicsData.data.length > 0 ? (
            <div className="space-y-4">
              {newTopicsData.data.map((topic: Topic) => (
                <PostCard
                  key={topic.id}
                  // Explicitly map Topic to PostCardTopic's flattened structure
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
                      // Flattened properties from 'profiles'
                      username: topic.profiles?.username ?? null,
                      avatar_url: topic.profiles?.avatar_url ?? null,
                      // Flattened properties from 'categories'
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
                currentPage={newTopicsData.currentPage}
                totalPages={newTopicsData.totalPages}
                totalItems={newTopicsData.totalCount}
                itemsPerPage={10}
                onPageChange={handlePageChange}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No new topics</h3>
              <p className="text-muted-foreground">
                Be the first to create a new discussion!
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="top" className="mt-6">
          {topTopicsData?.data && topTopicsData.data.length > 0 ? (
            <div className="space-y-4">
              {topTopicsData.data.map((topic: Topic) => (
                <PostCard
                  key={topic.id}
                  // Explicitly map Topic to PostCardTopic's flattened structure
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
                      // Flattened properties from 'profiles'
                      username: topic.profiles?.username ?? null,
                      avatar_url: topic.profiles?.avatar_url ?? null,
                      // Flattened properties from 'categories'
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
                currentPage={topTopicsData.currentPage}
                totalPages={topTopicsData.totalPages}
                totalItems={topTopicsData.totalCount}
                itemsPerPage={10}
                onPageChange={handlePageChange}
              />
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No top topics</h3>
              <p className="text-muted-foreground">
                No topics have gained significant views yet.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Main Forums Section (Level 1 Categories) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Main Forums</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">View All</Link>
          </Button>
        </div>

        {level1Forums && level1Forums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {level1Forums.map((forum) => (
              <Link
                key={forum.id}
                href={`/category/${forum.slug}`}
                className="group"
              >
                <Card className="p-4 flex items-center space-x-3 hover:bg-muted/50 transition-colors">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: forum.color ?? "" }}
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
            ))}
          </div>
        ) : (
          <Card className="p-4 flex items-center gap-3 hover:bg-primary/10 border hover:shadow-md transition-all rounded-xl">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No forums available</h3>
            <p className="text-muted-foreground">
              Forums will appear here once they are created.
            </p>
          </Card>
        )}
      </div>

      {/* Province/State Forums Section (Level 2 Categories) */}
      <div className="space-y-4 mb-2 md:mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Browse Province / State Forums
          </h2>
        </div>

        {level2Forums && level2Forums.length > 0 ? (
          <div className="space-y-6">
            {(() => {
              // IMPORTANT: Replace with actual IDs from your Supabase categories table
              const CANADA_PARENT_CATEGORY_ID =
                "11111111-1111-1111-1111-111111111111";
              const USA_PARENT_CATEGORY_ID =
                "22222222-2222-2222-2222-222222222222";

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

              const countries: { name: string; forums: Category[] }[] = [];
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
                  <div className="grid gap-3 h-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {country.forums.map((forum) => (
                      <Link
                        key={forum.id}
                        href={`/category/${forum.slug}`}
                        className="block"
                      >
                        <Card className="p-3 h-full flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start space-x-2">
                            <div
                              className="w-3 h-3 rounded-full mt-3 mr-6"
                              style={{ backgroundColor: forum.color ?? "" }}
                            />
                            <div>
                              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {forum.region}
                              </h4>

                              {forum.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {forum.description}
                                </p>
                              )}
                            </div>
                          </div>
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
