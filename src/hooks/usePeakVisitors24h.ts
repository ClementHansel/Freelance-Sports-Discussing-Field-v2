"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePeakVisitors24h = () => {
  return useQuery({
    queryKey: ["peak-visitors-24h"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_peak_visitors_24h");

      if (error) {
        console.error("Error fetching 24h peak visitors:", error);
        throw error;
      }

      return data?.[0] || { peak_count: 0, peak_hour: null };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
};
