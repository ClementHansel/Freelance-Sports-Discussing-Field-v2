"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Eye,
  Clock,
  MapPin,
  MessageSquare,
  FileText,
  Search,
  Ban,
} from "lucide-react";
import { useComprehensiveIPActivity } from "@/hooks/useComprehensiveIPActivity";
import { toast } from "@/hooks/use-toast";

interface IPActivityDetailsProps {
  ipAddress: string;
  onClose: () => void;
}

export const IPActivityDetails: React.FC<IPActivityDetailsProps> = ({
  ipAddress,
  onClose,
}) => {
  const {
    data: activity,
    isLoading,
    error,
  } = useComprehensiveIPActivity(ipAddress);

  if (isLoading)
    return <div className="p-6">Loading comprehensive activity...</div>;
  if (error)
    return (
      <div className="p-6 text-destructive">Error loading activity data</div>
    );
  if (!activity)
    return <div className="p-6">No activity found for this IP</div>;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "page_visit":
        return <Eye className="h-4 w-4" />;
      case "post_attempt":
        return <MessageSquare className="h-4 w-4" />;
      case "topic_create":
        return <FileText className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      case "report_submit":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (activity: any) => {
    if (activity.is_blocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    }

    switch (activity.type) {
      case "page_visit":
        return <Badge variant="outline">Visit</Badge>;
      case "post_attempt":
        return <Badge variant="secondary">Post</Badge>;
      case "topic_create":
        return <Badge variant="default">Topic</Badge>;
      case "search":
        return <Badge variant="outline">Search</Badge>;
      case "report_submit":
        return <Badge variant="destructive">Report</Badge>;
      default:
        return <Badge variant="outline">{activity.type}</Badge>;
    }
  };

  const exportData = () => {
    const exportData = {
      ip_address: activity.ip_address,
      summary: {
        total_sessions: activity.total_sessions,
        total_page_visits: activity.total_page_visits,
        total_posts: activity.total_posts,
        total_topics: activity.total_topics,
        total_reports: activity.total_reports,
        blocked_attempts: activity.blocked_attempts,
        first_seen: activity.first_seen,
        last_seen: activity.last_seen,
      },
      ban_status: activity.ban_status,
      recent_activities: activity.recent_activities,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ip-activity-${ipAddress}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Activity data exported successfully" });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6" />
            <h2 className="text-2xl font-bold">IP Activity: {ipAddress}</h2>
            {activity.ban_status.is_banned && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Ban className="h-3 w-3" />
                {activity.ban_status.ban_type}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              Export Data
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {activity.total_sessions}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {activity.total_page_visits}
              </div>
              <div className="text-sm text-muted-foreground">Page Visits</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {activity.total_posts}
              </div>
              <div className="text-sm text-muted-foreground">Posts Created</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {activity.blocked_attempts}
              </div>
              <div className="text-sm text-muted-foreground">
                Blocked Attempts
              </div>
            </Card>
          </div>

          {/* Ban Status */}
          {activity.ban_status.is_banned && (
            <Card className="p-4 mb-6 border-destructive bg-destructive/5">
              <h3 className="font-semibold text-destructive mb-2">
                Ban Information
              </h3>
              <div className="space-y-2">
                <div>
                  <strong>Type:</strong> {activity.ban_status.ban_type}
                </div>
                <div>
                  <strong>Reason:</strong> {activity.ban_status.reason}
                </div>
                {activity.ban_status.expires_at && (
                  <div>
                    <strong>Expires:</strong>{" "}
                    {new Date(activity.ban_status.expires_at).toLocaleString()}
                  </div>
                )}
                {activity.ban_status.admin_notes && (
                  <div>
                    <strong>Admin Notes:</strong>{" "}
                    {activity.ban_status.admin_notes}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Recent Activity Timeline
            </h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {activity.recent_activities.map((act, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    act.is_blocked
                      ? "bg-destructive/10 border border-destructive/20"
                      : "bg-muted/50"
                  }`}
                >
                  {getActivityIcon(act.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityBadge(act)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>

                    {act.action_data?.page_path && (
                      <div className="text-sm">
                        <strong>Page:</strong> {act.action_data.page_path}
                        {act.action_data.search_query && (
                          <span className="ml-2 text-muted-foreground">
                            (Search: "{act.action_data.search_query}")
                          </span>
                        )}
                      </div>
                    )}

                    {act.content_type && (
                      <div className="text-sm">
                        <strong>Content:</strong> {act.content_type}
                        {act.content_id && (
                          <span className="font-mono text-xs ml-1">
                            ({act.content_id})
                          </span>
                        )}
                      </div>
                    )}

                    {act.is_blocked && act.blocked_reason && (
                      <div className="text-sm text-destructive">
                        <strong>Blocked:</strong> {act.blocked_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};
