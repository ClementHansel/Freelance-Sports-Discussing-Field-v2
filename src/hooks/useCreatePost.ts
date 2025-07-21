"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { sessionManager } from "@/lib/utils/sessionManager";
import { getMandatoryUserIP } from "@/lib/utils/ipUtils";
import { useEnhancedSpamDetection } from "./useEnhancedSpamDetection";

interface CreatePostData {
  content: string;
  topic_id: string;
  parent_post_id?: string | null;
}

export const useCreatePost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkRateLimit, analyzeContent } = useEnhancedSpamDetection();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      // For anonymous users, check spam content only (rate limits removed)
      if (!user) {
        const tempUserId = sessionManager.getTempUserId();
        if (!tempUserId) {
          throw new Error("No temporary user session available");
        }

        // Analyze content for spam only
        const contentAnalysis = await analyzeContent(data.content, "post");
        if (!contentAnalysis.allowed) {
          throw new Error(contentAnalysis.message || "Content flagged as spam");
        }
      }

      // Check for banned words (backup check)
      const { data: bannedWordsResult, error: bannedWordsError } =
        await supabase.rpc("check_banned_words", {
          content_text: data.content,
        });

      if (bannedWordsError) {
        console.error("Banned words check failed:", bannedWordsError);
        // Continue with creation if check fails to avoid blocking legitimate posts
      } else if (bannedWordsResult) {
        const result = bannedWordsResult as {
          is_blocked: boolean;
          matches: Array<{ word: string }>;
        };
        if (result.is_blocked) {
          const matches = result.matches || [];
          const bannedWords = matches
            .map((match: any) => match.word)
            .join(", ");
          throw new Error(
            `You are not allowed to make posts with: ${bannedWords}`
          );
        }
      }

      // Get the topic to validate its category and check moderation requirements
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("category_id, categories(level, name, requires_moderation)")
        .eq("id", data.topic_id)
        .single();

      if (topicError) {
        throw new Error("Invalid topic");
      }

      // Validate that the topic's category is level 2 or 3
      if (topic.categories?.level !== 2 && topic.categories?.level !== 3) {
        throw new Error(
          `Posts can only be created in discussion or age group categories. This topic is in "${topic.categories?.name}" which is for browsing only.`
        );
      }

      // Get user's IP address for admin tracking - MANDATORY
      let userIP: string;
      try {
        userIP = await getMandatoryUserIP();
        console.log("DEBUG POST: Got mandatory user IP:", userIP);
      } catch (ipError) {
        console.error("Failed to get IP address:", ipError);
        throw new Error(
          "Unable to determine your IP address. Please check your network connection and try again."
        );
      }

      // Determine moderation status: all posts are auto-approved
      let moderationStatus = "approved";
      if (topic.categories?.requires_moderation) {
        // Category-specific moderation requirements (currently disabled for all categories)
        moderationStatus = "pending";
      }

      const postData: any = {
        content: data.content,
        topic_id: data.topic_id,
        parent_post_id: data.parent_post_id || null,
        moderation_status: moderationStatus,
        ip_address: userIP,
      };

      if (user) {
        // Authenticated user
        postData.author_id = user.id;
        postData.is_anonymous = false;
      } else {
        // Anonymous user - use temporary user ID
        const tempUserId = sessionManager.getTempUserId();
        if (!tempUserId) {
          throw new Error("No temporary user session available");
        }
        postData.author_id = tempUserId;
        postData.is_anonymous = true;
      }

      const { data: post, error } = await supabase
        .from("posts")
        .insert(postData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update topic's last_reply_at using secure function
      const { error: updateError } = await supabase.rpc(
        "update_topic_last_reply",
        {
          topic_id: data.topic_id,
        }
      );

      if (updateError) {
        console.error("Error updating topic last reply:", updateError);
      }

      // Increment reply count separately using raw SQL
      const { error: incrementError } = await supabase.rpc(
        "increment_reply_count",
        {
          topic_id: data.topic_id,
        }
      );

      if (incrementError) {
        console.error("Error incrementing reply count:", incrementError);
      }

      // No need for manual rate limiting - it's handled by the temp user system

      return post;
    },
    onSuccess: (post, variables) => {
      // Show appropriate success message based on moderation status
      if (post.moderation_status === "pending") {
        // This will be shown via toast in the component that calls this hook
      }

      // Only invalidate queries if post is approved (visible immediately)
      if (post.moderation_status === "approved") {
        // Invalidate and refetch posts for the topic
        queryClient.invalidateQueries({ queryKey: ["posts", post.topic_id] });

        // Invalidate ALL topics queries to ensure proper refresh
        queryClient.invalidateQueries({ queryKey: ["topics"] });
        queryClient.invalidateQueries({ queryKey: ["topics", undefined] });
        queryClient.invalidateQueries({ queryKey: ["hot-topics"] });

        // Force refetch to ensure immediate update
        queryClient.refetchQueries({ queryKey: ["topics"] });
        queryClient.refetchQueries({ queryKey: ["topics", undefined] });
      }
    },
  });
};
