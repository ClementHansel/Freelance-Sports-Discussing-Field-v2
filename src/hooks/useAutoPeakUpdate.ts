"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAutoPeakUpdate = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["auto-peak-update"],
    queryFn: async () => {
      // Get current 24h visitors
      const { data: currentVisitors, error: visitorsError } =
        await supabase.rpc("get_visitors_last_24h");

      if (visitorsError) {
        console.error("Error fetching current visitors:", visitorsError);
        return null;
      }

      // Get current peak
      const { data: peakData, error: peakError } = await supabase
        .rpc("get_peak_daily_visitors")
        .single();

      if (peakError) {
        console.error("Error fetching peak visitors:", peakError);
        return null;
      }

      // Compare and update if needed
      const currentCount = currentVisitors || 0;
      const peakCount = peakData?.peak_count || 0;

      if (currentCount > peakCount) {
        console.log(`Updating peak from ${peakCount} to ${currentCount}`);

        // Update the peak
        const { error: updateError } = await supabase.rpc(
          "update_peak_daily_visitors",
          {
            p_count: currentCount,
            p_date: new Date().toISOString().split("T")[0], // Today's date
          }
        );

        if (updateError) {
          console.error("Error updating peak visitors:", updateError);
        } else {
          // Invalidate related queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ["peak-daily-visitors"] });
          queryClient.invalidateQueries({ queryKey: ["visitors-24h"] });
        }
      }

      return {
        currentVisitors: currentCount,
        peakVisitors: peakCount,
        updated: currentCount > peakCount,
      };
    },
    refetchInterval: 60000, // Check every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
};
