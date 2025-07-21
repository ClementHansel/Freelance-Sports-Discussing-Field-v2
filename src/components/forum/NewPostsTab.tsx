"use client"; // This component uses client-side hooks and components

import React from "react";
import { TabsContent } from "@/components/ui/tabs"; // Assuming TabsContent is a client component
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

import { PostCard } from "@/components/forum/PostCard"; // Adjust path based on your components folder structure
import { PaginationControls } from "@/components/ui/pagination-controls"; // Assuming PaginationControls is a client component
import { Topic as UseTopicsTopic } from "@/hooks/useTopics"; // Import the Topic interface from useTopics

// Define a common interface for topics that PostCard expects
// This should be consistent with the TopicForCard interface in page.tsx
interface TopicForCard {
  id: string;
  created_at: string | null;
  title: string;
  content: string | null;
  view_count: number | null; // Changed from 'views' to 'view_count' to match UseTopicsTopic
  reply_count: number | null;
  // Removed 'last_post_at' as it's not expected by PostCard and conflicts with HotTopic
  author_id: string | null;
  category_id: string;
  is_locked: boolean | null;
  is_pinned: boolean | null;
  is_hidden: boolean | null; // Added and allow null
  slug: string | null;
  hot_score: number | null; // Added and allow null
  last_post_id: string | null;
  parent_category_id: string | null;
  parent_category_slug: string | null;
  username: string | null;
  avatar_url: string | null;
  category_name: string | null;
  category_color: string | null;
  category_slug: string | null;
  last_reply_at: string | null;
  updated_at: string | null;
}

// Define the props for the NewPostsTab component
interface NewPostsTabProps {
  newTopicsLoading: boolean;
  newTopicsData:
    | {
        data: UseTopicsTopic[]; // Use the imported Topic interface for data
        totalPages: number;
        totalCount: number;
      }
    | undefined;
  newPage: number;
  setNewPage: (page: number) => void;
  handleReport: (topicId: string) => void;
}

export function NewPostsTab({
  newTopicsLoading,
  newTopicsData,
  newPage,
  setNewPage,
  handleReport,
}: NewPostsTabProps) {
  return (
    <TabsContent value="new" className="space-y-4">
      {newTopicsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      ) : newTopicsData && newTopicsData.data.length > 0 ? (
        <>
          <div className="space-y-4">
            {newTopicsData.data.map((topic) => (
              <PostCard
                key={topic.id}
                topic={{
                  id: topic.id,
                  created_at: topic.created_at ?? null, // Provide fallback for null
                  title: topic.title,
                  content: topic.content ?? null, // Provide fallback for null
                  view_count: topic.view_count ?? null, // Mapped from view_count, provide fallback for null
                  reply_count: topic.reply_count ?? null, // Provide fallback for null
                  // Removed last_post_at from here as it's removed from TopicForCard
                  author_id: topic.author_id ?? null, // Provide fallback for null
                  category_id: topic.category_id,
                  is_locked: topic.is_locked ?? null, // Provide fallback for null
                  is_pinned: topic.is_pinned ?? null, // Provide fallback for null
                  is_hidden: topic.is_hidden ?? null, // Provide fallback for null
                  username: topic.profiles?.username ?? null,
                  avatar_url: topic.profiles?.avatar_url ?? null,
                  category_name: topic.categories?.name ?? null,
                  category_color: topic.categories?.color ?? null,
                  category_slug: topic.categories?.slug ?? null,
                  slug: topic.slug ?? null, // Provide fallback for null
                  hot_score: topic.hot_score ?? null, // Provide fallback for null
                  last_post_id: topic.last_post_id ?? null, // Provide fallback for undefined/null
                  parent_category_id:
                    topic.categories?.parent_category_id ?? null,
                  parent_category_slug: null, // Not directly available from useTopics, set to null
                  last_reply_at: topic.last_reply_at ?? null,
                  updated_at: topic.updated_at ?? null, // Provide fallback for null
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
  );
}
