"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ComprehensiveIPActivity {
  ip_address: string;
  total_sessions: number;
  total_page_visits: number;
  total_posts: number;
  total_topics: number;
  total_reports: number;
  blocked_attempts: number;
  first_seen: string;
  last_seen: string;
  recent_activities: Array<{
    type: string;
    content_type?: string;
    content_id?: string;
    is_blocked: boolean;
    blocked_reason?: string;
    created_at: string;
    action_data?: any;
  }>;
  ban_status: {
    is_banned: boolean;
    ban_type?: string;
    reason?: string;
    expires_at?: string;
    admin_notes?: string;
  };
}

export const useComprehensiveIPActivity = (ipAddress?: string) => {
  return useQuery({
    queryKey: ["comprehensive-ip-activity", ipAddress],
    queryFn: async () => {
      if (!ipAddress) return null;

      const { data, error } = await supabase.rpc(
        "get_comprehensive_ip_activity",
        {
          target_ip: ipAddress,
        }
      );

      if (error) throw error;
      return (data?.[0] as ComprehensiveIPActivity) || null;
    },
    enabled: !!ipAddress,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time monitoring
  });
};

interface SuspiciousIP {
  id: string;
  ip_address: string;
  post_count: number;
  topic_count: number;
  is_blocked: boolean;
  last_post_at: string;
  banned_ips?: {
    ban_type: string;
    reason: string;
    is_active: boolean;
  };
}

export const useAllSuspiciousIPs = () => {
  return useQuery({
    queryKey: ["all-suspicious-ips"],
    queryFn: async () => {
      // Get all IPs with significant activity
      const { data: trackingData, error: trackingError } = await supabase
        .from("anonymous_post_tracking")
        .select("*")
        .or("post_count.gte.3,topic_count.gte.2,is_blocked.eq.true")
        .order("last_post_at", { ascending: false });

      if (trackingError) throw trackingError;

      // Get banned IPs
      const { data: bannedData, error: bannedError } = await supabase
        .from("banned_ips")
        .select("ip_address, ban_type, reason, is_active")
        .eq("is_active", true);

      if (bannedError) throw bannedError;

      // Merge the data
      const result: SuspiciousIP[] =
        trackingData?.map((tracking) => {
          const banInfo = bannedData?.find(
            (ban) => String(ban.ip_address) === String(tracking.ip_address)
          );
          return {
            id: tracking.id,
            ip_address: String(tracking.ip_address),
            post_count: tracking.post_count || 0,
            topic_count: tracking.topic_count || 0,
            is_blocked: tracking.is_blocked || false,
            last_post_at:
              tracking.last_post_at ||
              tracking.created_at ||
              new Date().toISOString(),
            banned_ips: banInfo
              ? {
                  ban_type: banInfo.ban_type,
                  reason: banInfo.reason,
                  is_active: banInfo.is_active,
                }
              : undefined,
          };
        }) || [];

      return result;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
