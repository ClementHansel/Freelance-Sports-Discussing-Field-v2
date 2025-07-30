// src/hooks/useHotTopics.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface HotTopic {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  category_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean | null;
  view_count: number;
  reply_count: number;
  last_reply_at: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
  category_name: string;
  category_color: string;
  category_slug: string | null;
  slug: string | null;
  hot_score: number;
  last_post_id: string | null;
  parent_category_id: string | null;
  parent_category_slug: string | null;
  moderation_status: "approved" | "pending" | "rejected" | null; // Added based on serverDataFetcher type
}

export interface PaginatedHotTopicsResult {
  data: HotTopic[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface UseHotTopicsOptions {
  page?: number;
  limit?: number;
  // New: Optional initial data for hydration
  initialData?: PaginatedHotTopicsResult;
}

export const useHotTopics = ({
  page = 1,
  limit = 10,
  initialData, // Destructure initialData
}: UseHotTopicsOptions = {}) => {
  const offset = (page - 1) * limit;

  return useQuery<PaginatedHotTopicsResult>({
    queryKey: ["hot-topics", page, limit],
    queryFn: async () => {
      console.log("Fetching hot topics via useHotTopics hook (client-side)");
      const [topicsResult, countResult] = await Promise.all([
        supabase.rpc("get_hot_topics", {
          limit_count: limit,
          offset_count: offset,
        }),
        supabase.rpc("get_hot_topics_count"),
      ]);

      if (topicsResult.error) {
        console.error("Error fetching hot topics:", topicsResult.error);
        throw topicsResult.error;
      }

      if (countResult.error) {
        console.error("Error fetching hot topics count:", countResult.error);
        throw countResult.error;
      }

      const topics = (topicsResult.data as unknown as HotTopic[]).map(
        (item) => ({
          ...item,
          category_slug: item.category_slug || null,
          slug: item.slug || null,
          hot_score: item.hot_score ?? 0,
          last_post_id: item.last_post_id || null,
          parent_category_id: item.parent_category_id || null,
          parent_category_slug: item.parent_category_slug || null,
          moderation_status: item.moderation_status || null, // Ensure this is mapped
        }),
      );

      const totalCount = countResult.data as number;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: topics,
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    // Use initialData if provided. This is key for hydration.
    initialData: initialData,
    // Set staleTime to 0 if initialData is provided to force a re-fetch
    // or a very short staleTime if you want to re-fetch quickly after hydration.
    // For hot topics, a short staleTime (e.g., 10 seconds) is often good.
    staleTime: initialData ? 10 * 1000 : 5 * 60 * 1000, // 10s if initial, 5min otherwise
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};
