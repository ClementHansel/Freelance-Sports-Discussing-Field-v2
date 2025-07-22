"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types"; // Import Json if RPC returns generic JSON

export interface MostCommentedTopic {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  category_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
  category_name: string;
  category_color: string;
  category_slug: string | null; // Changed to allow null based on usage below
  slug: string | null; // Changed to allow null based on usage below
  hot_score: number;
  last_post_id: string | null;
  parent_category_id: string | null;
  parent_category_slug: string | null;
}

export interface PaginatedMostCommentedTopicsResult {
  data: MostCommentedTopic[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const useMostCommentedTopics = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  return useQuery<PaginatedMostCommentedTopicsResult>({
    // Explicitly type the query result
    queryKey: ["most-commented-topics", page, limit],
    queryFn: async () => {
      // Supabase RPC functions often return 'Json' or 'unknown'
      // We'll cast them to the expected types.
      const [topicsResult, countResult] = await Promise.all([
        supabase.rpc("get_most_commented_topics", {
          limit_count: limit,
          offset_count: offset,
        }),
        supabase.rpc("get_most_commented_topics_count"),
      ]);

      if (topicsResult.error) {
        console.error(
          "Error fetching most commented topics:",
          topicsResult.error
        );
        throw topicsResult.error;
      }

      if (countResult.error) {
        console.error(
          "Error fetching most commented topics count:",
          countResult.error
        );
        throw countResult.error;
      }

      // Directly cast to MostCommentedTopic[] or unknown as MostCommentedTopic[]
      // Then map to ensure all properties are present and correctly typed.
      const topics = (topicsResult.data as unknown as MostCommentedTopic[]).map(
        (item) => ({
          ...item,
          // Ensure category_slug and slug are string | null as per interface
          category_slug: item.category_slug || null,
          slug: item.slug || null,
          hot_score: item.hot_score ?? 0, // Use nullish coalescing for default 0
          last_post_id: item.last_post_id || null,
          parent_category_id: item.parent_category_id || null,
          parent_category_slug: item.parent_category_slug || null,
        })
      ); // No need for final 'as MostCommentedTopic[]' if map correctly returns it

      const totalCount = countResult.data as number; // Assuming count RPC returns a number
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: topics,
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
