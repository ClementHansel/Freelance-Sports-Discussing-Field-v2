"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types"; // Import Database type

// Define the exact return type for get_enriched_topics RPC function
// This assumes your Supabase RPC function 'get_enriched_topics' in public schema
// will return an array of objects with these properties.
// You might need to adjust this type if your RPC function's actual return structure differs.
type EnrichedTopicFromRPC =
  Database["public"]["Functions"]["get_enriched_topics"]["Returns"][number] & {
    is_hidden?: boolean | null; // Added if your RPC returns this but it's not in the auto-generated type
    hot_score?: number | null; // Added if your RPC returns this but it's not in the auto-generated type
    last_post_id?: string | null; // Added if your RPC returns this but it's not in the auto-generated type
  };

// Define the arguments type for get_enriched_topics RPC function
// This now reflects the parameters your Supabase function *actually* accepts.
type GetEnrichedTopicsArgs =
  Database["public"]["Functions"]["get_enriched_topics"]["Args"];

// Refine the Topic interface to match the structure returned by the RPC and subsequent mapping
export interface Topic {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  category_id: string;
  is_pinned: boolean | null;
  is_locked: boolean | null;
  is_hidden: boolean | null; // Changed to non-optional as it's directly mapped
  view_count: number | null;
  reply_count: number | null;
  last_reply_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  slug: string;
  hot_score: number | null; // Changed to non-optional as it's directly mapped
  last_post_id: string | null; // Changed to non-optional as it's directly mapped
  moderation_status: string | null; // Changed to non-optional as it's directly mapped
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
  categories?: {
    name: string;
    color: string | null;
    slug: string;
    parent_category_id?: string | null;
  } | null;
}

export interface PaginatedTopicsResult {
  data: Topic[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const useTopics = (
  categoryId?: string,
  page = 1,
  limit = 10,
  orderBy: string = "created_at",
  ascending: boolean = false
) => {
  const offset = (page - 1) * limit;

  return useQuery<PaginatedTopicsResult>({
    // Explicitly type the useQuery return
    queryKey: ["topics", categoryId, page, limit, orderBy, ascending], // Keep sorting params in queryKey for re-fetching on sort change
    queryFn: async () => {
      console.log(
        "Fetching topics for category:",
        categoryId,
        "with optimized function. Sorting will be done client-side."
      );

      // Prepare arguments for the RPC call, without p_order_by and p_ascending
      const rpcArgs: GetEnrichedTopicsArgs = {
        p_category_id: categoryId ?? undefined,
        p_limit: limit,
        p_offset: offset,
      };

      // Use the RPC function with its defined arguments
      const [{ data: topics, error }, { data: totalCount, error: countError }] =
        await Promise.all([
          supabase.rpc("get_enriched_topics", rpcArgs),
          supabase.rpc("get_enriched_topics_count", {
            p_category_id: categoryId ?? undefined,
          }),
        ]);

      if (error) {
        console.error("Error fetching enriched topics:", error);
        throw error;
      }

      if (countError) {
        console.error("Error fetching topics count:", countError);
        throw countError;
      }

      if (!topics || topics.length === 0) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
        } as PaginatedTopicsResult;
      }

      // Transform enriched data to match expected Topic interface
      const enrichedTopics: Topic[] = topics.map(
        (topic: EnrichedTopicFromRPC) => ({
          id: topic.id,
          title: topic.title,
          content: topic.content,
          author_id: topic.author_id,
          category_id: topic.category_id,
          is_pinned: topic.is_pinned,
          is_locked: topic.is_locked,
          is_hidden: topic.is_hidden ?? null, // Use nullish coalescing for safety
          view_count: topic.view_count,
          reply_count: topic.reply_count,
          last_reply_at: topic.last_reply_at,
          created_at: topic.created_at,
          updated_at: topic.updated_at,
          slug: topic.slug,
          hot_score: topic.hot_score ?? null, // Use nullish coalescing for safety
          last_post_id: topic.last_post_id ?? null, // Use nullish coalescing for safety
          moderation_status: topic.moderation_status ?? null, // Use nullish coalescing for safety
          profiles: topic.author_username
            ? {
                username: topic.author_username,
                avatar_url: topic.author_avatar_url,
              }
            : null,
          categories: topic.category_name
            ? {
                name: topic.category_name,
                color: topic.category_color,
                slug: topic.category_slug,
                parent_category_id: topic.parent_category_id,
              }
            : null,
        })
      );

      // --- Client-side sorting ---
      const sortedTopics = [...enrichedTopics].sort((a, b) => {
        let valA: number, valB: number; // Changed 'any' to 'number'

        switch (orderBy) {
          case "created_at":
            valA = new Date(a.created_at || 0).getTime();
            valB = new Date(b.created_at || 0).getTime();
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
            valA = new Date(a.created_at || 0).getTime(); // Default to created_at
            valB = new Date(b.created_at || 0).getTime();
            break;
        }

        if (valA < valB) {
          return ascending ? -1 : 1;
        }
        if (valA > valB) {
          return ascending ? 1 : -1;
        }
        return 0;
      });
      // --- End client-side sorting ---

      console.log(
        "Optimized topics fetched and client-side sorted:",
        sortedTopics.length,
        "topics"
      );

      const totalPages = Math.ceil((totalCount as number) / limit);

      return {
        data: sortedTopics,
        totalCount: totalCount as number,
        totalPages,
        currentPage: page,
      };
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
