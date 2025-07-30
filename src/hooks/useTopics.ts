// src/hooks/useTopics.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Define the exact return type for get_enriched_topics RPC function
// Based on types.ts -> Functions -> get_enriched_topics -> Returns
type EnrichedTopicFromRPC =
  Database["public"]["Functions"]["get_enriched_topics"]["Returns"][number];

// Define the exact return type for get_hot_topics RPC function
// Based on types.ts -> Functions -> get_hot_topics -> Returns
type HotTopicFromRPC =
  Database["public"]["Functions"]["get_hot_topics"]["Returns"][number];

// Refine the Topic interface to match the structure returned by the RPC and subsequent mapping
export interface Topic {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  category_id: string;
  is_pinned: boolean | null;
  is_locked: boolean | null;
  is_hidden: boolean | null; // Not in RPC, explicitly nullable
  view_count: number | null;
  reply_count: number | null;
  last_reply_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  slug: string | null;
  hot_score: number | null; // RPC returns number for hot topics, explicitly nullable in enriched
  last_post_id: string | null;
  moderation_status: string | null; // RPC returns string, but we allow string | null

  // ADDED/CONFIRMED: These fields are present in the raw topic data from the database table 'topics'
  // but might not be returned by RPCs like get_enriched_topics.
  // They are needed for the `Topic` interface to match `RawTopicData` for server-side fetching.
  ip_address: string | null; // Assuming 'inet' maps to string | null
  is_anonymous: boolean | null;
  is_public: boolean | null;
  canonical_url: string | null;

  // Flattened relations from RPC
  profiles: {
    username: string | null;
    avatar_url: string | null;
    // ADDED: id, bio, created_at, reputation, updated_at as they are selected in serverDataFetcher
    id: string;
    bio: string | null;
    created_at: string | null;
    reputation: number | null;
    updated_at: string | null;
  } | null;
  categories: {
    name: string | null;
    color: string | null;
    slug: string | null;
    parent_category_id: string | null;
    // ADDED: id as it is selected in serverDataFetcher
    id: string;
  } | null;
}

// HotTopic interface: Define it directly from HotTopicFromRPC structure
// It is NOT extending Topic anymore to avoid `moderation_status` conflict.
export interface HotTopic {
  id: string;
  title: string;
  content: string | null; // RPC returns non-nullable, but allow null for consistency with Topic
  author_id: string | null; // RPC returns non-nullable, but allow null for consistency with Topic
  category_id: string;
  is_pinned: boolean | null; // RPC returns non-nullable, but allow null for consistency with Topic
  is_locked: boolean | null; // RPC returns non-nullable, but allow null for consistency with Topic
  is_hidden: boolean | null; // Not in RPC, explicitly nullable
  view_count: number | null; // RPC returns non-nullable, but allow null for consistency with Topic
  reply_count: number | null; // RPC returns non-nullable, but allow null for consistency with Topic
  last_reply_at: string | null; // RPC returns non-nullable, but allow null for consistency with Topic
  created_at: string | null; // RPC returns non-nullable, but allow null for consistency with Topic
  updated_at: string | null; // RPC returns non-nullable, but allow null for consistency with Topic
  slug: string | null;
  hot_score: number | null; // RPC returns non-nullable, but allow null for consistency with Topic
  last_post_id: string | null; // RPC returns non-nullable, but allow null for consistency with Topic
  // moderation_status is NOT returned by get_hot_topics, so it's absent here.

  // Direct properties from HotTopicFromRPC for profiles and categories
  username: string;
  avatar_url: string;
  category_name: string;
  category_color: string;
  category_slug: string;
  parent_category_slug: string | null;

  // Re-add profiles and categories structure for consistency if needed by consumers
  // These will be mapped from the direct properties above
  profiles: {
    username: string;
    avatar_url: string;
  };
  categories: {
    name: string;
    color: string;
    slug: string;
    parent_category_id: string | null; // HotTopicFromRPC has parent_category_id as string
  };
}

export interface PaginatedTopicsResult {
  data: Topic[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedHotTopicsResult {
  data: HotTopic[]; // Use HotTopic[] for hot topics
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface UseTopicsOptions {
  categoryId?: string | null; // Changed to allow null
  page?: number;
  limit?: number;
  orderBy?: "created_at" | "view_count" | "reply_count" | "hot_score";
  ascending?: boolean;
  initialData?: PaginatedTopicsResult; // For SSR hydration
  enabled?: boolean; // ADDED: enabled property
}

export const useTopics = (options?: UseTopicsOptions) => {
  const {
    categoryId,
    page = 1,
    limit = 10,
    orderBy = "created_at",
    ascending = false,
    initialData,
    enabled = true, // Default to true
  } = options || {};

  const offset = (page - 1) * limit;

  // Construct queryKey explicitly to ensure no 'null' values are passed
  const queryKey = [
    "topics",
    categoryId === null ? undefined : categoryId, // Convert null to undefined
    page,
    limit,
    orderBy,
    ascending,
  ].filter((item) => item !== undefined); // Filter out any undefined values

  return useQuery<PaginatedTopicsResult>({
    queryKey: queryKey, // Use the filtered queryKey
    queryFn: async () => {
      console.log(
        `Fetching topics for category ${
          categoryId || "all"
        } with order ${orderBy} ${ascending ? "ASC" : "DESC"}`,
      );

      const [topicsResult, countResult] = await Promise.all([
        supabase.rpc("get_enriched_topics", {
          // FIX: Pass undefined instead of null if categoryId is null
          p_category_id: categoryId ?? undefined, // Use nullish coalescing to convert null to undefined
          p_limit: limit,
          p_offset: offset,
        }),
        supabase.rpc("get_enriched_topics_count", {
          // FIX: Pass undefined instead of null if categoryId is null
          p_category_id: categoryId ?? undefined, // Use nullish coalescing to convert null to undefined
        }),
      ]);

      if (topicsResult.error) {
        console.error("Error fetching enriched topics:", topicsResult.error);
        throw topicsResult.error;
      }
      if (countResult.error) {
        console.error(
          "Error fetching enriched topics count:",
          countResult.error,
        );
        throw countResult.error;
      }

      const enrichedTopics = (
        topicsResult.data as EnrichedTopicFromRPC[]
      ).map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content || null,
        author_id: item.author_id || null,
        category_id: item.category_id,
        is_pinned: item.is_pinned,
        is_locked: item.is_locked,
        is_hidden: null, // Not returned by RPC, explicitly null
        view_count: item.view_count,
        reply_count: item.reply_count,
        last_reply_at: item.last_reply_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        slug: item.slug,
        hot_score: null, // Not returned by get_enriched_topics RPC, explicitly null
        last_post_id: item.last_post_id,
        moderation_status: item.moderation_status || null,
        // Ensure these match the updated Topic interface
        ip_address: null, // RPC does not return this, explicitly null
        is_anonymous: null, // RPC does not return this, explicitly null
        is_public: null, // RPC does not return this, explicitly null
        canonical_url: null, // RPC does not return this, explicitly null
        profiles: item.author_username
          ? {
            username: item.author_username,
            avatar_url: item.author_avatar_url,
            id: "", // Default or fetch if needed
            bio: null,
            created_at: null,
            reputation: null,
            updated_at: null,
          }
          : null,
        categories: item.category_name
          ? {
            name: item.category_name,
            color: item.category_color,
            slug: item.category_slug,
            parent_category_id: item.parent_category_id || null,
            id: "", // Default or fetch if needed
          }
          : null,
      }));

      // --- Client-side sorting ---
      const sortedTopics = [...enrichedTopics].sort((a, b) => {
        let valA: number | string | null, valB: number | string | null;

        switch (orderBy) {
          case "created_at":
            valA = a.created_at ? new Date(a.created_at).getTime() : 0;
            valB = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
          case "view_count":
            valA = a.view_count ?? 0;
            valB = b.view_count ?? 0;
            break;
          case "reply_count":
            valA = a.reply_count ?? 0;
            valB = b.reply_count ?? 0;
            break;
          case "hot_score":
            valA = a.hot_score ?? 0;
            valB = b.hot_score ?? 0;
            break;
          default:
            valA = a.created_at ? new Date(a.created_at).getTime() : 0;
            valB = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return ascending ? valA - valB : valB - valA;
        }
        return 0;
      });
      // --- End client-side sorting ---

      console.log(
        "Optimized topics fetched and client-side sorted:",
        sortedTopics.length,
        "topics",
      );

      const totalCount = countResult.data as number;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: sortedTopics,
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    initialData: initialData, // Hydrate with initial data
    enabled: enabled, // Use the enabled option
  });
};
