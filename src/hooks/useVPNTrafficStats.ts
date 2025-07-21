"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VPNTrafficStats {
  total_vpn_visits_today: number;
  unique_vpn_ips_today: number;
  vpn_post_attempts_blocked: number;
  total_blocked_attempts: number;
  vpn_percentage: number;
}

export const useVPNTrafficStats = () => {
  return useQuery({
    queryKey: ["vpn-traffic-stats"],
    queryFn: async () => {
      console.log("🔍 Fetching VPN traffic stats...");

      try {
        // Get VPN visits today
        const { data: vpnVisits, error: vpnError } = await supabase
          .from("ip_visit_tracking")
          .select("ip_address, is_vpn")
          .eq("is_vpn", true)
          .gte(
            "created_at",
            new Date().toISOString().split("T")[0] + "T00:00:00.000Z"
          );

        if (vpnError) {
          console.error("❌ Error fetching VPN visits:", vpnError);
          throw vpnError;
        }

        console.log("📊 VPN visits found:", vpnVisits?.length || 0);

        // Get total visits today for percentage calculation
        const { data: totalVisits, error: totalError } = await supabase
          .from("ip_visit_tracking")
          .select("id")
          .gte(
            "created_at",
            new Date().toISOString().split("T")[0] + "T00:00:00.000Z"
          );

        if (totalError) {
          console.error("❌ Error fetching total visits:", totalError);
          throw totalError;
        }

        // Get blocked attempts from anonymous_post_tracking
        const { data: blockedAttempts, error: blockedError } = await supabase
          .from("anonymous_post_tracking")
          .select("id, is_blocked, ip_address")
          .eq("is_blocked", true)
          .gte(
            "created_at",
            new Date().toISOString().split("T")[0] + "T00:00:00.000Z"
          );

        if (blockedError) {
          console.error("❌ Error fetching blocked attempts:", blockedError);
          throw blockedError;
        }

        console.log("🚫 Total blocked attempts:", blockedAttempts?.length || 0);

        // Get VPN IPs from geolocation cache
        const { data: vpnIPs, error: vpnIPsError } = await supabase
          .from("ip_geolocation_cache")
          .select("ip_address")
          .eq("is_vpn", true);

        if (vpnIPsError) {
          console.error("❌ Error fetching VPN IPs:", vpnIPsError);
          throw vpnIPsError;
        }

        // Create a Set of known VPN IPs for fast lookup
        // FIX: Cast item.ip_address to string
        const vpnIPSet = new Set(
          vpnIPs?.map((item) => String(item.ip_address)) || []
        );

        // Count VPN-specific blocked attempts by matching IPs
        const vpnBlockedAttempts =
          blockedAttempts?.filter((attempt) =>
            // FIX: Cast attempt.ip_address to string
            vpnIPSet.has(String(attempt.ip_address))
          ) || [];

        console.log("🔒 VPN blocked attempts:", vpnBlockedAttempts.length);

        // FIX: Cast v.ip_address to string before using in Set
        const uniqueVPNIPs = new Set(
          vpnVisits?.map((v) => String(v.ip_address)) || []
        ).size;
        const totalVPNVisits = vpnVisits?.length || 0;
        const totalVisitsCount = totalVisits?.length || 0;
        const vpnPercentage =
          totalVisitsCount > 0 ? (totalVPNVisits / totalVisitsCount) * 100 : 0;

        const stats: VPNTrafficStats = {
          total_vpn_visits_today: totalVPNVisits,
          unique_vpn_ips_today: uniqueVPNIPs,
          vpn_post_attempts_blocked: vpnBlockedAttempts.length,
          total_blocked_attempts: blockedAttempts?.length || 0,
          vpn_percentage: Math.round(vpnPercentage * 100) / 100,
        };

        console.log("📈 VPN Stats computed:", stats);
        return stats;
      } catch (error) {
        console.error("💥 Fatal error in VPN stats:", error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: 1000,
  });
};
