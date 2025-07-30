"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  User,
  Clock,
  Pin,
  Search,
  TrendingUp,
  Star,
  Plus,
} from "lucide-react"; // Plus is already imported here
import { PaginationControls } from "@/components/ui/pagination-controls"; // Import PaginationControls
import { QuickTopicModal } from "@/components/forum/QuickTopicModal"; // Import QuickTopicModal

import {
  useTopics, // Use the updated useTopics hook
  PaginatedTopicsResult,
  Topic as UseTopicsTopic,
} from "@/hooks/useTopics";
import { useForumSettings, ForumSettingsMap } from "@/hooks/useForumSettings"; // Import useForumSettings
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth for canCreateTopic logic

// Define the allowed sort options for topics (consistent with serverDataFetcher)
type TopicSortBy = "created_at" | "view_count" | "reply_count" | "hot_score";

// Define props for the Topics client component
interface TopicsProps {
  initialTopics?: PaginatedTopicsResult;
  initialForumSettings?: ForumSettingsMap;
  currentPage: number;
  sortBy: TopicSortBy;
  errorOccurred?: boolean; // Prop to indicate if an error occurred during SSR
}

export default function Topics({
  initialTopics,
  initialForumSettings,
  currentPage: initialCurrentPage,
  sortBy: initialSortBy,
  errorOccurred,
}: TopicsProps) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [sortBy, setSortBy] = useState<TopicSortBy>(initialSortBy);
  // FIXED: Declared quickTopicModalOpen state here
  const [quickTopicModalOpen, setQuickTopicModalOpen] = useState(false);

  // Determine ascending based on sortBy
  const ascending = sortBy === "created_at" ? false : false; // Newest first for 'created_at', otherwise descending for 'hot/top'

  // Use useTopics with initialData for hydration
  const { data: topicsData, isLoading } = useTopics({
    page: currentPage,
    limit: 10, // Adjust limit as per your pagination needs
    orderBy: sortBy,
    ascending: ascending,
    initialData: initialTopics,
  });

  // Use useForumSettings with initialData for hydration
  const { settings: forumSettings } = useForumSettings({
    initialData: initialForumSettings,
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value as TopicSortBy); // Cast value to TopicSortBy
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Determine if user can create a topic
  const canCreateTopic =
    user ||
    (forumSettings?.["anonymous_posting_enabled"]?.value === true &&
      forumSettings?.["anonymous_topic_creation_enabled"]?.value === true);

  // If an error occurred during SSR, display an error message
  if (errorOccurred) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error Loading Topics</h3>
          <p>
            We encountered an issue loading the topics. Please try again later.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Topics</h1>
          <p className="text-gray-600">Browse all forum discussions</p>
        </div>
        {canCreateTopic && (
          <Button
            onClick={() => setQuickTopicModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Topic
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search topics..." className="pl-10 w-full" />
            </div>
          </div>
          {/* Category Filter (Placeholder - requires fetching categories) */}
          <Select>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {/* You would map your categories here */}
              <SelectItem value="general">General Discussion</SelectItem>
              <SelectItem value="equipment">Equipment & Gear</SelectItem>
              <SelectItem value="coaching">Coaching & Training</SelectItem>
              <SelectItem value="tournaments">Tournaments & Events</SelectItem>
            </SelectContent>
          </Select>
          {/* Sort By Filter */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" /> Latest Activity
                </div>
              </SelectItem>
              <SelectItem value="view_count">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2" /> Most Popular
                </div>
              </SelectItem>
              <SelectItem value="reply_count">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" /> Most Replies
                </div>
              </SelectItem>
              {/* If your RPC for enriched topics returns hot_score, uncomment this */}
              {/* <SelectItem value="hot_score">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" /> Hot Topics
              </div>
            </SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Topics List */}
      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        ) : topicsData && topicsData.data.length > 0 ? (
          <div className="space-y-4">
            {topicsData.data.map((topic: UseTopicsTopic) => (
              <div
                key={topic.id}
                // Main topic item: flex-col on mobile, flex-row on sm+
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0"
              >
                {/* Left section: Topic Icon, Title, Author, Category */}
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {topic.is_pinned && (
                      <Pin className="h-4 w-4 text-red-500" />
                    )}
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={
                        topic.slug && topic.categories?.slug
                          ? `/category/${topic.categories.slug}/${topic.slug}`
                          : `/topic/${topic.id}`
                      }
                      className="font-medium text-gray-900 hover:text-blue-600 block"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                      <span>by {topic.profiles?.username || "Unknown"}</span>
                      <Badge variant="outline" className="text-xs">
                        {topic.categories?.name || "General"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right section: Stats (Replies, Views, Time Ago) */}
                {/* On mobile (default): flex-row, flex-wrap, gap-x-4, mt-3, justify-start */}
                {/* On sm+ (desktop): sm:flex-row (redundant but explicit), sm:items-center, sm:space-x-6, sm:mt-0, sm:justify-end */}
                <div className="flex flex-row flex-wrap items-center gap-x-4 text-sm text-gray-500 mt-3 sm:mt-0 sm:ml-4 sm:space-x-6 sm:justify-end flex-shrink-0">
                  <div className="flex items-center space-x-1 whitespace-nowrap">
                    <MessageSquare className="h-4 w-4" />
                    <span>{topic.reply_count || 0} replies</span>
                  </div>
                  <div className="flex items-center space-x-1 whitespace-nowrap">
                    <User className="h-4 w-4" />
                    <span>{topic.view_count || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-1 whitespace-nowrap">
                    <Clock className="h-4 w-4" />
                    <span className="whitespace-nowrap">
                      {formatDistanceToNow(
                        new Date(topic.last_reply_at || topic.created_at || "")
                      )}{" "}
                      ago
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <PaginationControls
              currentPage={topicsData.currentPage}
              totalPages={topicsData.totalPages}
              totalItems={topicsData.totalCount}
              itemsPerPage={10} // Match the limit used in useTopics
              onPageChange={handlePageChange}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No topics found
            </h3>
            <p className="text-gray-600 mb-4">
              Be the first to start a discussion!
            </p>
            {canCreateTopic && (
              <Button onClick={() => setQuickTopicModalOpen(true)}>
                Create First Topic
              </Button>
            )}
          </div>
        )}
      </Card>
      {/* Quick Topic Modal */}
      <QuickTopicModal
        isOpen={quickTopicModalOpen}
        onClose={() => setQuickTopicModalOpen(false)}
      />
    </div>
  );
}
