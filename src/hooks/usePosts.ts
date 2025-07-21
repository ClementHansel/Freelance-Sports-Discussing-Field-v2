"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types"; // Import Database type

// Define the exact return type for get_enriched_posts RPC function
type EnrichedPostFromRPC =
  Database["public"]["Functions"]["get_enriched_posts"]["Returns"][number];

// Refine the Post interface to match the structure returned by the RPC and subsequent mapping
export interface Post {
  id: string;
  content: string;
  author_id: string | null;
  topic_id: string;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
  vote_score: number | null; // Assuming this is part of your application logic, not directly from RPC
  moderation_status: string | null;
  ip_address?: unknown; // Supabase uses 'unknown' for 'inet' type
  is_anonymous?: boolean | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
  temporary_users?: { display_name: string } | null; // Added for anonymous users
  parent_post?: Post; // Recursive type for nested replies
}

interface UsePostsOptions {
  page?: number;
  limit?: number;
}

interface UsePostsResult {
  posts: Post[];
  totalCount: number;
}

export const usePosts = (topicId: string, options: UsePostsOptions = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  return useQuery<UsePostsResult>({
    // Explicitly type the useQuery return
    queryKey: ["posts", topicId, page, limit],
    queryFn: async (): Promise<UsePostsResult> => {
      console.log(
        "Fetching posts for topic:",
        topicId,
        "page:",
        page,
        "with optimized function"
      );

      // Use the RPC function with its defined arguments
      const [{ data: posts, error }, { data: totalCount, error: countError }] =
        await Promise.all([
          supabase.rpc("get_enriched_posts", {
            p_topic_id: topicId,
            p_limit: limit,
            p_offset: offset,
          }),
          supabase.rpc("get_enriched_posts_count", {
            p_topic_id: topicId,
          }),
        ]);

      if (error) {
        console.error("Error fetching enriched posts:", error);
        throw error;
      }

      if (countError) {
        console.error("Error fetching posts count:", countError);
        throw countError;
      }

      if (!posts || posts.length === 0) {
        return { posts: [], totalCount: totalCount || 0 };
      }

      // Transform enriched data to match expected Post interface
      const enrichedPosts: Post[] = posts.map((post: EnrichedPostFromRPC) => ({
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        topic_id: post.topic_id,
        parent_post_id: post.parent_post_id,
        created_at: post.created_at,
        updated_at: post.updated_at,
        vote_score: null, // Not used in current UI, assuming default null
        moderation_status: post.moderation_status,
        ip_address: post.ip_address,
        is_anonymous: post.is_anonymous,
        profiles: post.author_username
          ? {
              username: post.author_username,
              avatar_url: post.author_avatar_url,
            }
          : null, // Explicitly null if no username
        temporary_users:
          post.author_username && post.author_username.startsWith("Guest") // Simple heuristic to determine if it's a temp user
            ? { display_name: post.author_username }
            : null,
        parent_post: post.parent_post_content
          ? {
              id: post.parent_post_id!,
              content: post.parent_post_content,
              author_id: null, // Assuming parent post author_id is not returned by RPC
              topic_id: topicId,
              parent_post_id: null,
              created_at: post.parent_post_created_at!,
              updated_at: post.parent_post_created_at!,
              vote_score: null,
              moderation_status: post.parent_post_moderation_status,
              ip_address: undefined,
              is_anonymous: undefined,
              profiles: post.parent_post_author_username
                ? {
                    username: post.parent_post_author_username,
                    avatar_url: post.parent_post_author_avatar_url,
                  }
                : null,
            }
          : undefined,
      }));

      console.log(
        "Optimized posts fetched:",
        enrichedPosts.length,
        "posts in single query"
      );
      return { posts: enrichedPosts, totalCount: totalCount || 0 };
    },
    enabled: !!topicId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
