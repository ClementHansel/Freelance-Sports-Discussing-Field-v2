"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Users,
  MapPin,
  Eye,
  Clock,
  Shield,
  Wifi,
  AlertTriangle,
} from "lucide-react";
import {
  useActiveVisitors,
  useGeographicSummary,
} from "@/hooks/useActiveVisitors";
import { useVPNTrafficStats } from "@/hooks/useVPNTrafficStats";
import { formatDistanceToNow } from "date-fns";

export const LiveVisitorMonitor: React.FC = () => {
  const {
    data: activeVisitors,
    isLoading: visitorsLoading,
    error: visitorsError,
    refetch,
  } = useActiveVisitors();
  const {
    data: geoSummary,
    isLoading: geoLoading,
    error: geoError,
  } = useGeographicSummary(24);
  const {
    data: vpnStats,
    isLoading: vpnLoading,
    error: vpnError,
  } = useVPNTrafficStats();

  // Error Reporting
  useEffect(() => {
    if (visitorsError) Sentry.captureException(visitorsError);
    if (geoError) Sentry.captureException(geoError);
    if (vpnError) Sentry.captureException(vpnError);
  }, [visitorsError, geoError, vpnError]);

  // Auto-refresh every 5 seconds
  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        refetch();
      } catch (err) {
        Sentry.captureException(err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const getFlagEmoji = (countryCode: string) => {
    try {
      if (!countryCode || countryCode === "Unknown") return "🌍";
      return countryCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt(0))
        );
    } catch (e) {
      Sentry.captureException(e);
      return "🌍";
    }
  };

  const getPageDisplayName = (path: string) => {
    if (!path) return "Unknown";
    if (path === "/") return "Home";
    if (path.startsWith("/c/")) return "Category";
    if (path.startsWith("/t/")) return "Topic";
    if (path.startsWith("/admin")) return "Admin";
    return path
      .replace(/^\//, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header with live count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-semibold">Live Visitors</h2>
          </div>
          <Badge variant="secondary" className="text-sm">
            {activeVisitors?.length || 0} active now
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={visitorsLoading}
        >
          <Eye className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Traffic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Countries (24h)</p>
              <p className="text-2xl font-bold">
                {geoLoading ? "..." : geoSummary?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">
                Total Visitors (24h)
              </p>
              <p className="text-2xl font-bold">
                {geoLoading
                  ? "..."
                  : geoSummary?.reduce(
                      (sum, item) => sum + item.visitor_count,
                      0
                    ) || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Page Views (24h)</p>
              <p className="text-2xl font-bold">
                {geoLoading
                  ? "..."
                  : geoSummary?.reduce(
                      (sum, item) => sum + item.page_views,
                      0
                    ) || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">VPN Traffic (24h)</p>
              <p className="text-2xl font-bold">
                {vpnLoading ? "..." : vpnStats?.total_vpn_visits_today || 0}
              </p>
              {vpnStats && (
                <p className="text-xs text-muted-foreground">
                  {vpnStats.vpn_percentage}% of total traffic
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* VPN Traffic Details */}
      {vpnStats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            VPN & Security Traffic (Today)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  VPN Visitors
                </span>
              </div>
              <p className="text-xl font-bold text-orange-900">
                {vpnStats.unique_vpn_ips_today}
              </p>
              <p className="text-xs text-orange-700">Unique IPs detected</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Blocked Attempts
                </span>
              </div>
              <p className="text-xl font-bold text-red-900">
                {vpnStats.vpn_post_attempts_blocked}
              </p>
              <p className="text-xs text-red-700">VPN posting blocked</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  Total Blocks
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {vpnStats.total_blocked_attempts}
              </p>
              <p className="text-xs text-gray-700">All blocked attempts</p>
            </div>
          </div>

          {vpnStats.total_vpn_visits_today > 0 ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Traffic Analysis:</strong>{" "}
                {vpnStats.total_vpn_visits_today} VPN visits detected today (
                {vpnStats.vpn_percentage}% of total traffic) from{" "}
                {vpnStats.unique_vpn_ips_today} unique IPs.
                {vpnStats.vpn_post_attempts_blocked > 0
                  ? ` ${vpnStats.vpn_post_attempts_blocked} posting attempts were blocked.`
                  : " No posting attempts were blocked."}
              </p>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No VPN traffic detected today</p>
            </div>
          )}
        </Card>
      )}

      {/* Active Visitors List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Active Visitors Right Now
        </h3>

        {visitorsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : activeVisitors && activeVisitors.length > 0 ? (
          <div className="space-y-3">
            {activeVisitors.map((visitor, index) => (
              <div
                key={`${visitor.ip_address}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {getFlagEmoji(visitor.country_code)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {visitor.city}, {visitor.country_name}
                      </span>
                      {visitor.is_vpn && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          VPN
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {visitor.ip_address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {getPageDisplayName(visitor.current_page)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {visitor.total_pages} pages
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    Last active:{" "}
                    {formatDistanceToNow(new Date(visitor.last_activity))} ago
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Session:{" "}
                    {formatDistanceToNow(new Date(visitor.session_start))} ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active visitors detected</p>
            <p className="text-sm">
              Visitors are considered active if they've been on the site in the
              last 10 minutes
            </p>
          </div>
        )}
      </Card>

      {/* Geographic Distribution */}
      {geoSummary && geoSummary.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Geographic Distribution (Last 24 Hours)
          </h3>
          <div className="space-y-2">
            {geoSummary.slice(0, 10).map((country, index) => (
              <div
                key={country.country_code}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {getFlagEmoji(country.country_code)}
                  </span>
                  <span className="font-medium">{country.country_name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {country.visitor_count} visitors
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {country.page_views} views
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
