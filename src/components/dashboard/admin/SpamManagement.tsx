"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Shield, Activity, Ban, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BannedWordsManager } from "./BannedWordsManager";
import { BannedIPsManager } from "./BannedIPsManager";
import { IPActivityDetails } from "./IPActivityDetails";
import { useAllSuspiciousIPs } from "@/hooks/useComprehensiveIPActivity"; // Assuming this hook returns the correct type

// --- Interfaces for Spam Management Data ---

interface SpamReport {
  id: string;
  content_type: string;
  content_id: string;
  report_reason: string;
  automated_detection: boolean;
  confidence_score: number;
  status: string;
  created_at: string;
  reviewed_at?: string;
  admin_notes?: string;
  reporter_ip?: string; // Assuming this is a string IP address
}

// Define a more specific type for spam_indicators
interface SpamIndicators {
  [key: string]: boolean | number | string; // Adjust this union type based on actual data
}

interface ContentAnalysis {
  id: string;
  content_hash: string;
  content_type: string;
  spam_indicators: SpamIndicators; // Changed from Record<string, any>
  is_spam: boolean;
  confidence_score: number;
  created_at: string;
}

// Interface for the banned_ips data that might be joined to suspicious IPs
interface BannedIPJoin {
  reason: string | null;
  ban_type: string | null; // <--- CHANGED: From specific literals to general string | null
  is_active: boolean;
  // Add other fields from banned_ips if they are joined (e.g., id, expires_at)
}

// Interface for individual suspicious IP entries
export interface SuspiciousIP {
  // Exported for use in useAllSuspiciousIPs hook
  id: string; // ID from anonymous_post_tracking or similar
  ip_address: string; // Assuming IP address is string
  session_id: string | null; // From anonymous_post_tracking
  post_count: number;
  topic_count: number;
  is_blocked: boolean; // From anonymous_post_tracking
  block_reason?: string | null; // From anonymous_post_tracking
  last_post_at: string; // From anonymous_post_tracking
  created_at: string | null; // <--- THIS MUST BE 'string | null'
  // Joined data from banned_ips table
  banned_ips: BannedIPJoin | null;
}

export default function SpamManagement() {
  const [selectedTab, setSelectedTab] = useState("reports");
  const [selectedIP, setSelectedIP] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch spam reports
  const { data: spamReports, isLoading: reportsLoading } = useQuery<
    SpamReport[]
  >({
    // Explicitly type data
    queryKey: ["spam-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spam_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SpamReport[];
    },
  });

  // Fetch content analysis
  const { data: contentAnalysis, isLoading: analysisLoading } = useQuery<
    ContentAnalysis[]
  >({
    // Explicitly type data
    queryKey: ["content-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_analysis")
        .select("*")
        .eq("is_spam", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ContentAnalysis[];
    },
  });

  // Fetch all suspicious IPs with enhanced data
  // Assuming useAllSuspiciousIPs returns SuspiciousIP[]
  const { data: suspiciousIPs, isLoading: activityLoading } =
    useAllSuspiciousIPs();

  // Update spam report status
  const updateReportMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string; // Consider making this a union type if known (e.g., "pending" | "reviewed" | "resolved")
      notes?: string | null; // Allow null for notes
    }) => {
      const { error } = await supabase
        .from("spam_reports")
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spam-reports"] });
      toast({ title: "Report updated successfully" });
    },
    onError: (error: unknown) => {
      // Changed 'any' to 'unknown'
      let errorMessage = "Failed to update report";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Error updating report:", error);
      toast({
        title: "Failed to update report",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Block/unblock user
  const blockUserMutation = useMutation({
    mutationFn: async ({
      id,
      block,
      reason,
    }: {
      id: string;
      block: boolean;
      reason?: string | null; // Allow null for reason
    }) => {
      const { error } = await supabase
        .from("anonymous_post_tracking") // This table name seems to be for tracking, not direct banning
        .update({
          is_blocked: block,
          block_reason: reason,
          block_expires_at: block
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suspicious-activity"] }); // Invalidate relevant query
      queryClient.invalidateQueries({ queryKey: ["all-suspicious-ips"] }); // Invalidate the hook's query key
      toast({ title: "User status updated successfully" });
    },
    onError: (error: unknown) => {
      // Changed 'any' to 'unknown'
      let errorMessage = "Failed to update user status";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Error updating user status:", error);
      toast({
        title: "Failed to update user status",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8)
      return (
        <Badge variant="destructive">
          High ({Math.round(confidence * 100)}%)
        </Badge>
      );
    if (confidence >= 0.5)
      return (
        <Badge variant="secondary">
          Medium ({Math.round(confidence * 100)}%)
        </Badge>
      );
    return (
      <Badge variant="outline">Low ({Math.round(confidence * 100)}%)</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "reviewed":
        return <Badge variant="outline">Reviewed</Badge>;
      case "resolved":
        return <Badge variant="default">Resolved</Badge>;
      case "false_positive":
        return <Badge variant="destructive">False Positive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Spam Management</h1>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Enhanced Activity
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="banned-words" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Banned Words
          </TabsTrigger>
          <TabsTrigger value="banned-ips" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            IP Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Spam Reports</h3>
            {reportsLoading ? (
              <div>Loading reports...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Automated</TableHead>
                    <TableHead>Reporter IP</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spamReports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="capitalize">
                        {report.content_type}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {report.report_reason}
                      </TableCell>
                      <TableCell>
                        {report.confidence_score
                          ? getConfidenceBadge(report.confidence_score)
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {report.automated_detection ? (
                          <Badge variant="outline">Auto</Badge>
                        ) : (
                          <Badge variant="secondary">Manual</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {report.reporter_ip || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateReportMutation.mutate({
                                id: report.id,
                                status: "resolved",
                              })
                            }
                            disabled={report.status === "resolved"}
                          >
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateReportMutation.mutate({
                                id: report.id,
                                status: "false_positive",
                              })
                            }
                            disabled={report.status === "false_positive"}
                          >
                            False Positive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Content Analysis Results
            </h3>
            {analysisLoading ? (
              <div>Loading analysis...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Indicators</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentAnalysis?.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell className="capitalize">
                        {analysis.content_type}
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(analysis.confidence_score)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {/* Iterate over typed spam_indicators */}
                          {Object.entries(analysis.spam_indicators).map(
                            ([key, value]) =>
                              value && ( // Only render if value is truthy
                                <Badge
                                  key={key}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {key}
                                </Badge>
                              )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {analysis.content_hash.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Enhanced IP Activity Monitoring
            </h3>
            {activityLoading ? (
              <div>Loading comprehensive activity data...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspiciousIPs?.map((ip) => (
                    <TableRow key={`${ip.ip_address}-${ip.id}`}>
                      <TableCell className="font-mono">
                        {String(ip.ip_address)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ip.post_count + ip.topic_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            ip.post_count > 5
                              ? "text-orange-600 font-medium"
                              : ""
                          }
                        >
                          {ip.post_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            ip.topic_count > 2
                              ? "text-orange-600 font-medium"
                              : ""
                          }
                        >
                          {ip.topic_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ip.banned_ips?.reason?.includes("report") // Accessing typed properties
                              ? "destructive"
                              : "outline"
                          }
                        >
                          Reports
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ip.banned_ips?.ban_type === "shadowban" && ( // Accessing typed properties
                            <Badge
                              variant="outline"
                              className="bg-orange-50 text-orange-700 border-orange-200"
                            >
                              Shadow Banned
                            </Badge>
                          )}
                          {ip.banned_ips?.ban_type === "permanent" && ( // Accessing typed properties
                            <Badge variant="destructive">Permanent Ban</Badge>
                          )}
                          {ip.is_blocked && (
                            <Badge variant="destructive">Blocked</Badge>
                          )}
                          {!ip.is_blocked && !ip.banned_ips && (
                            <Badge variant="secondary">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(ip.last_post_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIP(String(ip.ip_address))}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant={ip.is_blocked ? "outline" : "destructive"}
                            onClick={() =>
                              blockUserMutation.mutate({
                                id: ip.id,
                                block: !ip.is_blocked,
                                reason: ip.is_blocked
                                  ? null // Changed undefined to null for consistency with DB
                                  : "Enhanced monitoring - suspicious activity",
                              })
                            }
                          >
                            {ip.is_blocked ? "Unblock" : "Block"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Live IP Monitoring Dashboard
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 border-orange-200 bg-orange-50">
                <div className="text-2xl font-bold text-orange-600">
                  24.50.34.131
                </div>
                <div className="text-sm text-muted-foreground">
                  Primary Target IP
                </div>
                <Badge variant="destructive" className="mt-2">
                  Shadow Banned
                </Badge>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">
                  {suspiciousIPs?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Monitored IPs
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  Real-time
                </div>
                <div className="text-sm text-muted-foreground">
                  Monitoring Active
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">
                  Quick Actions for Target IP (24.50.34.131)
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIP("24.50.34.131")}
                  >
                    View Full Activity
                  </Button>
                  <Button size="sm" variant="destructive" disabled>
                    Already Shadow Banned
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground p-4 bg-blue-50 rounded-lg">
                <strong>Monitoring Status:</strong> This dashboard automatically
                tracks all activity from monitored IPs. Shadow-banned users will
                continue to see their posts but they won't appear to other
                users. All attempted actions are logged for evidence collection.
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="banned-words">
          <BannedWordsManager />
        </TabsContent>

        <TabsContent value="banned-ips">
          <BannedIPsManager />
        </TabsContent>
      </Tabs>

      {/* IP Activity Details Modal */}
      {selectedIP && (
        <IPActivityDetails
          ipAddress={selectedIP}
          onClose={() => setSelectedIP(null)}
        />
      )}
    </div>
  );
}
