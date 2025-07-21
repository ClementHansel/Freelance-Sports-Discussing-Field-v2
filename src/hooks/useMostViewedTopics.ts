"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MostViewedTopic {
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
  category_slug: string;
  slug: string;
  hot_score: number;
  last_post_id: string | null;
  parent_category_id: string | null;
  parent_category_slug: string | null;
}

export interface PaginatedMostViewedTopicsResult {
  data: MostViewedTopic[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const useMostViewedTopics = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["most-viewed-topics", page, limit],
    queryFn: async () => {
      const [topicsResult, countResult] = await Promise.all([
        supabase.rpc("get_most_viewed_topics", {
          limit_count: limit,
          offset_count: offset,
        }),
        supabase.rpc("get_most_viewed_topics_count"),
      ]);

      if (topicsResult.error) {
        console.error("Error fetching most viewed topics:", topicsResult.error);
        throw topicsResult.error;
      }

      if (countResult.error) {
        console.error(
          "Error fetching most viewed topics count:",
          countResult.error
        );
        throw countResult.error;
      }

      const topics = (topicsResult.data as any[]).map((item) => ({
        ...item,
        category_slug: item.category_slug || "",
        slug: item.slug || "",
        hot_score: 0, // Not applicable for most viewed
        last_post_id: item.last_post_id || null,
        parent_category_id: item.parent_category_id || null,
        parent_category_slug: item.parent_category_slug || null,
      })) as MostViewedTopic[];

      const totalCount = countResult.data as number;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: topics,
        totalCount,
        totalPages,
        currentPage: page,
      } as PaginatedMostViewedTopicsResult;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
