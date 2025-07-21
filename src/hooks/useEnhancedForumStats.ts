"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedForumStats {
  total_topics: number;
  total_posts: number;
  total_members: number;
  topics_today: number;
  posts_today: number;
  members_today: number;
  topics_this_week: number;
  posts_this_week: number;
  members_this_week: number;
  most_active_category: string | null;
  top_poster: string | null;
}

export const useEnhancedForumStats = () => {
  return useQuery({
    queryKey: ["enhanced-forum-stats"],
    queryFn: async () => {
      console.log("Fetching enhanced forum statistics");

      const { data, error } = await supabase
        .rpc("get_enhanced_forum_stats")
        .single();

      if (error) {
        console.error("Error fetching enhanced forum stats:", error);
        throw error;
      }

      console.log("Enhanced forum stats fetched:", data);
      return data as EnhancedForumStats;
    },
  });
};
