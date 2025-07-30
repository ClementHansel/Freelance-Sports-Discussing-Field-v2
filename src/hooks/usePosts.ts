// src/hooks/usePosts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types"; // Import Database type
// NEW: Import ModerationStatus and isValidModerationStatus
import { isValidModerationStatus, ModerationStatus } from "@/types/forum";

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
  created_at: string | null; // FIX: Allow null
  updated_at: string | null; // FIX: Allow null
  vote_score: number | null; // Assuming this is part of your application logic, not directly from RPC
  // FIXED: Use ModerationStatus type for consistency
  moderation_status: ModerationStatus | null;
  ip_address: string | null;
  is_anonymous: boolean | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
    id: string;
    bio: string | null;
    created_at: string | null;
    reputation: number | null;
    updated_at: string | null;
  } | null;
  temporary_users?: { display_name: string } | null; // Added for anonymous users
  parent_post?: Post; // Recursive type for nested replies
}

// EXPORTED: PaginatedPostsResult
export interface PaginatedPostsResult {
  posts: Post[];
  totalCount: number;
  totalPages: number;
  currentPage: number; // Added currentPage for consistency
}

// UPDATED: UsePostsOptions to include initialData and enabled
interface UsePostsOptions {
  page?: number;
  limit?: number;
  initialData?: PaginatedPostsResult | null; // Allow null for initialData
  enabled?: boolean; // ADDED: enabled property to control query execution
}

export const usePosts = (topicId: string, options: UsePostsOptions = {}) => {
  const { page = 1, limit = 20, initialData, enabled = true } = options; // Destructure new options
  const offset = (page - 1) * limit;

  // Prepare initialData to be strictly PaginatedPostsResult or undefined
  const queryInitialData = initialData === null ? undefined : initialData;

  return useQuery<PaginatedPostsResult>({
    // Explicitly type the useQuery return
    queryKey: ["posts", topicId, page, limit],
    queryFn: async (): Promise<PaginatedPostsResult> => {
      console.log(
        "Fetching posts for topic:",
        topicId,
        "page:",
        page,
        "with optimized function",
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

      // Calculate totalPages here, as it's needed in both return paths
      const calculatedTotalCount = totalCount || 0;
      const calculatedTotalPages = Math.ceil(calculatedTotalCount / limit);

      if (!posts || posts.length === 0) {
        return {
          posts: [],
          totalCount: calculatedTotalCount,
          totalPages: calculatedTotalPages,
          currentPage: page,
        };
      }

      // Transform enriched data to match expected Post interface
      const enrichedPosts: Post[] = posts.map((post: EnrichedPostFromRPC) => ({
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        topic_id: post.topic_id,
        parent_post_id: post.parent_post_id,
        created_at: post.created_at || null, // Map to string | null
        updated_at: post.updated_at || null, // Map to string | null
        vote_score: null, // Not used in current UI, assuming default null
        // FIXED: Use isValidModerationStatus to ensure correct type
        moderation_status: isValidModerationStatus(post.moderation_status),
        ip_address: (post.ip_address as string) || null,
        is_anonymous: post.is_anonymous ?? null, // Ensure boolean | null
        profiles: post.author_username
          ? {
            username: post.author_username,
            avatar_url: post.author_avatar_url,
            id: post.author_id || "", // Ensure id is provided
            bio: null,
            created_at: null,
            reputation: null,
            updated_at: null,
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
            created_at: post.parent_post_created_at! || null, // Map to string | null
            updated_at: post.parent_post_created_at! || null, // Map to string | null
            vote_score: null,
            // FIXED: Use isValidModerationStatus for parent_post's moderation status
            moderation_status: isValidModerationStatus(
              post.parent_post_moderation_status,
            ),
            ip_address: null, // Set to null as these properties are not in EnrichedPostFromRPC for parent_post
            is_anonymous: null, // Set to null as these properties are not in EnrichedPostFromRPC for parent_post
            profiles: post.parent_post_author_username
              ? {
                username: post.parent_post_author_username,
                avatar_url: post.parent_post_author_avatar_url,
                id: "", // Default or fetch if needed
                bio: null,
                created_at: null,
                reputation: null,
                updated_at: null,
              }
              : null,
          }
          : undefined,
      }));

      console.log(
        "Optimized posts fetched:",
        enrichedPosts.length,
        "posts in single query",
      );
      return {
        posts: enrichedPosts,
        totalCount: calculatedTotalCount,
        totalPages: calculatedTotalPages,
        currentPage: page,
      };
    },
    // Pass the prepared initialData
    initialData: queryInitialData,
    enabled: enabled && !!topicId, // Only fetch if enabled and topicId is provided
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
