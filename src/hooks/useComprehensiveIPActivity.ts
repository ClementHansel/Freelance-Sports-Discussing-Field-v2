"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json, Database } from "@/integrations/supabase/types"; // Import Database and Json
import { SuspiciousIP } from "@/components/dashboard/admin/SpamManagement"; // Import SuspiciousIP

// --- Interfaces for ComprehensiveIPActivity ---
// These interfaces reflect the *expected* structure of the JSON blobs
// returned by the 'get_comprehensive_ip_activity' RPC.

// Specific action data types (adjust as needed based on actual data)
interface PageVisitActionData {
  page_path?: string;
  search_query?: string;
}

interface PostAttemptActionData {
  // Define fields relevant to a post attempt
  content_preview?: string;
  // ... other fields
}

interface TopicCreateActionData {
  // Define fields relevant to a topic creation
  topic_title?: string;
  // ... other fields
}

// Union type for action_data (not directly used in ComprehensiveIPActivity, but good for context)
type ActionData =
  | PageVisitActionData
  | PostAttemptActionData
  | TopicCreateActionData
  | null;

interface RecentActivity {
  type: string;
  content_type?: string | null;
  content_id?: string | null;
  is_blocked: boolean;
  blocked_reason?: string | null;
  created_at: string;
  action_data?: Json; // This comes as Json from Supabase RPC
}

interface BanStatus {
  is_banned: boolean;
  ban_type?: string | null;
  reason?: string | null;
  expires_at?: string | null;
  admin_notes?: string | null;
}

// Main ComprehensiveIPActivity interface, reflecting the RPC return
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
  recent_activities: Json; // This comes as Json from Supabase RPC
  ban_status: Json; // This comes as Json from Supabase RPC
}

// --- End Interfaces for ComprehensiveIPActivity ---

export const useComprehensiveIPActivity = (ipAddress?: string) => {
  return useQuery<ComprehensiveIPActivity | null>({
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
      return (data?.[0] as unknown as ComprehensiveIPActivity) || null;
    },
    enabled: !!ipAddress,
    refetchInterval: 30000,
  });
};

// --- Supabase generated types for tables ---
import { Database as SupabaseDatabase } from "@/integrations/supabase/types"; // Renamed to avoid conflict with local Database type if any

type AnonymousPostTrackingRow =
  SupabaseDatabase["public"]["Tables"]["anonymous_post_tracking"]["Row"];
type BannedIpsRow = SupabaseDatabase["public"]["Tables"]["banned_ips"]["Row"]; // <-- Moved this line UP

// Define a specific type for the selected columns from banned_ips
type BannedIpsSelectedColumns = Pick<
  BannedIpsRow,
  "id" | "ip_address" | "ban_type" | "reason" | "is_active"
>;

export const useAllSuspiciousIPs = () => {
  return useQuery<SuspiciousIP[]>({
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
        .select("id, ip_address, ban_type, reason, is_active");

      if (bannedError) throw bannedError;

      // Merge the data
      const result: SuspiciousIP[] =
        trackingData?.map((tracking: AnonymousPostTrackingRow) => {
          const banInfo = bannedData?.find(
            (ban: BannedIpsSelectedColumns) =>
              String(ban.ip_address) === String(tracking.ip_address)
          );

          return {
            id: tracking.id,
            ip_address: String(tracking.ip_address),
            session_id: tracking.session_id || null,
            post_count: tracking.post_count || 0,
            topic_count: tracking.topic_count || 0,
            is_blocked: tracking.is_blocked || false,
            last_post_at:
              tracking.last_post_at ||
              tracking.created_at ||
              new Date().toISOString(),
            created_at: tracking.created_at || null, // This must match SuspiciousIP's definition
            banned_ips: banInfo
              ? {
                  ban_type: banInfo.ban_type || null,
                  reason: banInfo.reason || null,
                  is_active: banInfo.is_active || false,
                }
              : null,
          };
        }) || [];

      return result;
    },
    refetchInterval: 60000,
  });
};
