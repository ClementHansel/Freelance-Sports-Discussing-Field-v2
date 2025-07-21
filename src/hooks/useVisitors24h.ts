"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVisitors24h = () => {
  return useQuery({
    queryKey: ["visitors-24h"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_visitors_last_24h");

      if (error) {
        console.error("Error fetching 24h visitors:", error);
        throw error;
      }

      return data || 0;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
};
