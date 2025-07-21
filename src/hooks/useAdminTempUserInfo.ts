"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TempUserInfo {
  id: string;
  session_id: string;
  display_name: string;
  guest_number: number;
  created_at: string;
  expires_at: string;
}

export const useAdminTempUserInfo = (userId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-temp-user-info", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("temporary_users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as TempUserInfo;
    },
    enabled: !!userId && user?.role === "admin",
  });
};

export const useAdminDisplayName = (userId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-display-name", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc("get_admin_display_name", {
        temp_user_id: userId,
      });

      if (error) throw error;
      return data as string;
    },
    enabled: !!userId && user?.role === "admin",
  });
};
