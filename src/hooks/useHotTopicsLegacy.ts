"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types"; // Import Json if RPC returns generic JSON

export interface HotTopic {
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
  // Note: parent_category_id and parent_category_slug are not in this interface,
  // but they were in useHotTopics. If this legacy hook truly doesn't return them, that's fine.
  // If it *can* return them, they should be added here too.
}

// Legacy hook for backward compatibility - returns array of hot topics
export const useHotTopicsLegacy = (limit = 25) => {
  return useQuery<HotTopic[]>({
    // Explicitly type the query result
    queryKey: ["hot-topics-legacy", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_hot_topics", {
        limit_count: limit,
        offset_count: 0,
      });

      if (error) {
        console.error("Error fetching hot topics:", error);
        throw error;
      }

      // Directly cast to HotTopic[] or unknown as HotTopic[]
      // Then map to ensure all properties are present and correctly typed.
      return (data as unknown as HotTopic[]).map((item) => ({
        ...item,
        // Ensure category_slug and slug are string | null as per interface
        category_slug: item.category_slug || null,
        slug: item.slug || null,
        last_post_id: item.last_post_id || null,
        // hot_score might also be missing, so add default if needed
        hot_score: item.hot_score ?? 0, // Assuming hot_score might be missing or null
      })); // No need for final 'as HotTopic[]' if map correctly returns it
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
