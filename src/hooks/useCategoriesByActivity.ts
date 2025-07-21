"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "./useCategories";

interface CategoryWithActivity extends Category {
  last_activity_at: string | null;
}

export const useCategoriesByActivity = (
  parentId?: string | null, // This can be string, null, or undefined from the caller
  level?: number
) => {
  return useQuery({
    queryKey: ["categories-by-activity", parentId, level],
    queryFn: async () => {
      console.log(
        "Fetching categories by activity with parentId:",
        parentId,
        "level:",
        level
      );

      // FIX: Convert null to undefined for p_parent_category_id
      // Supabase RPC parameters typically expect undefined for optional parameters,
      // not null, if the database function parameter is not nullable but optional.
      const { data, error } = await supabase.rpc("get_categories_by_activity", {
        p_parent_category_id: parentId ?? undefined, // Convert null to undefined
        p_category_level: level,
      });

      if (error) {
        console.error("Error fetching categories by activity:", error);
        throw error;
      }

      console.log("Categories by activity fetched:", data);
      return data as CategoryWithActivity[];
    },
  });
};
