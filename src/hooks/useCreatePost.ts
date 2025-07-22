"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { sessionManager } from "@/lib/utils/sessionManager";
import { getMandatoryUserIP } from "@/lib/utils/ipUtils";
import { useEnhancedSpamDetection } from "./useEnhancedSpamDetection";
import { Database } from "@/integrations/supabase/types"; // Import Database for precise types

interface CreatePostData {
  content: string;
  topic_id: string;
  parent_post_id?: string | null;
}

// Define the expected return type for check_banned_words RPC
interface BannedWordsCheckResult {
  is_blocked: boolean;
  matches: Array<{ word: string; severity?: string; category?: string }>; // Added optional severity/category if they exist
}

// Define the expected structure for the topic data with joined categories
type TopicWithCategory = Database["public"]["Tables"]["topics"]["Row"] & {
  categories?: {
    // Joined category data
    level: number;
    name: string;
    requires_moderation: boolean;
  } | null;
};

// Define the type for a new post inserted into the database
type NewPost = Database["public"]["Tables"]["posts"]["Insert"];
// Define the type for a post returned after insertion (with all columns)
type InsertedPost = Database["public"]["Tables"]["posts"]["Row"];

export const useCreatePost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkRateLimit, analyzeContent } = useEnhancedSpamDetection();

  return useMutation<InsertedPost, Error, CreatePostData>({
    // Explicitly type mutation: Result, Error, Variables
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
        // Cast bannedWordsResult to the defined interface
        const result = bannedWordsResult as unknown as BannedWordsCheckResult;
        if (result.is_blocked) {
          const matches = result.matches || [];
          const bannedWords = matches
            .map((match) => match.word) // 'match' is now typed, no 'any' needed
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

      if (!topic) {
        // Add null check for topic
        throw new Error("Topic not found.");
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
      let moderationStatus: "approved" | "pending" = "approved"; // Explicitly type union
      if (topic.categories?.requires_moderation) {
        // Category-specific moderation requirements (currently disabled for all categories)
        moderationStatus = "pending";
      }

      const postData: NewPost = {
        // Typed postData as NewPost (Insert type)
        content: data.content,
        topic_id: data.topic_id,
        parent_post_id: data.parent_post_id || null,
        moderation_status: moderationStatus,
        ip_address: userIP,
        // author_id and is_anonymous will be set conditionally below
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

      if (!post) {
        // Add null check for inserted post
        throw new Error("Post creation failed: No post data returned.");
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

      return post;
    },
    onSuccess: (post, variables) => {
      // 'post' is now InsertedPost, 'variables' is CreatePostData
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
        queryClient.invalidateQueries({ queryKey: ["hot-topics"] }); // Invalidate hot topics too

        // Force refetch to ensure immediate update
        queryClient.refetchQueries({ queryKey: ["topics"] });
        queryClient.refetchQueries({ queryKey: ["topics", undefined] });
      }
    },
    onError: (error: unknown) => {
      // Type error as unknown
      let errorMessage = "Failed to create post";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Post creation error:", error);
      // You might want to add a toast here as well for user feedback
      // toast({ title: "Error creating post", description: errorMessage, variant: "destructive" });
    },
  });
};
