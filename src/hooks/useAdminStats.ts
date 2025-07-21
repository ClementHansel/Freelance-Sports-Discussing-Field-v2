"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  total_users: number;
  total_posts: number;
  total_topics: number;
  pending_reports: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Get total posts
      const { count: totalPosts, error: postsError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      if (postsError) throw postsError;

      // Get total topics
      const { count: totalTopics, error: topicsError } = await supabase
        .from("topics")
        .select("*", { count: "exact", head: true });

      if (topicsError) throw topicsError;

      // For now, set pending reports to 0 (we can implement this later)
      const pendingReports = 0;

      return {
        total_users: totalUsers || 0,
        total_posts: totalPosts || 0,
        total_topics: totalTopics || 0,
        pending_reports: pendingReports,
      } as AdminStats;
    },
  });
};
