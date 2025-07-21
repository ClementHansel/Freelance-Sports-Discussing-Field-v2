"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryStats {
  topic_count: number;
  post_count: number;
}

export const useCategoryStats = (categoryId: string) => {
  return useQuery({
    queryKey: ["category-stats", categoryId],
    queryFn: async () => {
      console.log("Fetching category statistics for:", categoryId);

      const { data, error } = await supabase
        .rpc("get_category_stats", { category_id: categoryId })
        .single();

      if (error) {
        console.error("Error fetching category stats:", error);
        throw error;
      }

      console.log("Category stats fetched:", data);
      return data as CategoryStats;
    },
    enabled: !!categoryId,
  });
};
