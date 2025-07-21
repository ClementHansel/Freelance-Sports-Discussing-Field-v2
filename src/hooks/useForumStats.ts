"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ForumStats {
  total_topics: number;
  total_posts: number;
  total_members: number;
}

export const useForumStats = () => {
  return useQuery({
    queryKey: ["forum-stats"],
    queryFn: async () => {
      console.log("Fetching forum statistics");

      const { data, error } = await supabase.rpc("get_forum_stats").single();

      if (error) {
        console.error("Error fetching forum stats:", error);
        throw error;
      }

      console.log("Forum stats fetched:", data);
      return data as ForumStats;
    },
  });
};
