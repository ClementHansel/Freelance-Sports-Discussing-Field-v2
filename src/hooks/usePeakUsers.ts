"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PeakUsersData {
  peak_count: number;
  peak_date: string;
}

export const usePeakUsers = () => {
  return useQuery({
    queryKey: ["peak-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_peak_users").single();

      if (error) {
        throw error;
      }

      return data as PeakUsersData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
