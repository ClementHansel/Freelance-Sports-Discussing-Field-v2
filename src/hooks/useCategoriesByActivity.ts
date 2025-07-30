// src/hooks/useCategoriesByActivity.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "./useCategories"; // Import the base Category interface
import { Database } from "@/integrations/supabase/types"; // Import Database for precise RPC types
import { PostgrestError } from "@supabase/supabase-js"; // Import PostgrestError

export interface CategoryWithActivity extends Category {
  last_activity_at: string | null;
  topic_count: number | null; // Now expecting a number from RPC
  post_count: number | null; // Now expecting a number from RPC
}

interface UseCategoriesByActivityOptions {
  parentId?: string | null;
  level?: number;
  enabled?: boolean;
  initialData?: CategoryWithActivity[];
}

// Define the exact type for the return of your 'get_categories_by_activity' RPC.
// IMPORTANT: This type MUST accurately reflect the columns returned by your Supabase function.
// Assuming your Supabase RPC now returns 'topic_count' and 'post_count'.
type GetCategoriesByActivityRPCActualReturn =
  & Database["public"]["Tables"]["categories"]["Row"]
  & {
    last_activity_at: string | null;
    topic_count: number | null; // EXPECTING this from the RPC
    post_count: number | null; // EXPECTING this from the RPC
  };

export const useCategoriesByActivity = (
  options?: UseCategoriesByActivityOptions,
) => {
  const {
    parentId = undefined,
    level = undefined,
    enabled = true,
    initialData,
  } = options || {};

  return useQuery<CategoryWithActivity[]>({
    queryKey: ["categories-by-activity", parentId, level],
    queryFn: async () => {
      console.log(
        "Fetching categories by activity with parentId:",
        parentId,
        "level:",
        level,
      );

      const { data, error } = await supabase.rpc("get_categories_by_activity", {
        p_parent_category_id: parentId ?? undefined,
        p_category_level: level,
      }) as {
        data: GetCategoriesByActivityRPCActualReturn[] | null;
        error: PostgrestError | null;
      };

      if (error) {
        console.error("Error fetching categories by activity:", error);
        throw error;
      }

      console.log("Categories by activity fetched:", data);

      return (data || []).map((
        item: GetCategoriesByActivityRPCActualReturn,
      ) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        slug: item.slug,
        color: item.color,
        sort_order: item.sort_order,
        is_active: item.is_active,
        created_at: item.created_at,
        level: item.level,
        parent_category_id: item.parent_category_id,
        region: item.region,
        birth_year: item.birth_year,
        play_level: item.play_level,

        // These fields are part of the base 'Category' in your types.ts
        // and should be present if your 'categories' table has them.
        requires_moderation: item.requires_moderation ?? null,
        canonical_url: item.canonical_url ?? null,
        meta_description: item.meta_description ?? null,
        meta_keywords: item.meta_keywords ?? null,
        meta_title: item.meta_title ?? null,
        og_description: item.og_description ?? null,
        og_image: item.og_image ?? null,
        og_title: item.og_title ?? null,

        // These are from the RPC's aggregated data
        last_activity_at: item.last_activity_at || null,
        // FIXED: Now map directly from 'item' as the RPC is expected to return them
        topic_count: item.topic_count ?? null, // Use nullish coalescing for safety
        post_count: item.post_count ?? null, // Use nullish coalescing for safety
      })) as CategoryWithActivity[];
    },
    enabled: enabled,
    initialData: initialData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
