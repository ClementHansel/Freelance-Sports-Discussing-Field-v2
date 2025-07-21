"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePostPage = (
  topicId: string,
  postId: string,
  postsPerPage: number = 20
) => {
  return useQuery({
    queryKey: ["post-page", topicId, postId, postsPerPage],
    queryFn: async () => {
      if (!topicId || !postId) return null;

      // First, get the target post to get its creation time
      const { data: targetPost, error: targetError } = await supabase
        .from("posts")
        .select("created_at")
        .eq("id", postId)
        .eq("topic_id", topicId)
        .eq("moderation_status", "approved")
        .single();

      if (targetError || !targetPost) {
        console.error("Error finding target post:", targetError);
        return null;
      }

      // Count posts created before or at the same time as the target post
      const { count, error: countError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("topic_id", topicId)
        .eq("moderation_status", "approved")
        .lte("created_at", targetPost.created_at);

      if (countError) {
        console.error("Error counting posts:", countError);
        return null;
      }

      const position = count || 0;
      const pageNumber = Math.ceil(position / postsPerPage);

      return {
        page: Math.max(1, pageNumber),
        position: position,
      };
    },
    enabled: !!topicId && !!postId,
  });
};
