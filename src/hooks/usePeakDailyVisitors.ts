"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PeakDailyVisitorsData {
  peak_count: number;
  peak_date: string;
}

export const usePeakDailyVisitors = () => {
  return useQuery({
    queryKey: ["peak-daily-visitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_peak_daily_visitors")
        .single();

      if (error) {
        throw error;
      }

      return data as PeakDailyVisitorsData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
