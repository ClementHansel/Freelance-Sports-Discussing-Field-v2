"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  CheckCircle,
  X,
  Eye,
  Save,
  ExternalLink,
  Trash2,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any; // Consider defining a more specific type for 'report' if possible
  onUpdate: () => void;
}

export const ReportDetailsModal = ({
  isOpen,
  onClose,
  report,
  onUpdate,
}: ReportDetailsModalProps) => {
  const [adminNotes, setAdminNotes] = useState(report?.admin_notes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [reporterBehavior, setReporterBehavior] = useState<any>(null);
  const [previousReports, setPreviousReports] = useState<any>(null);
  const { toast } = useToast();

  // Load reporter behavior data when modal opens
  useEffect(() => {
    if (isOpen && report) {
      loadReporterData();
      loadPreviousReports();
    }
  }, [isOpen, report]);

  const loadReporterData = async () => {
    if (!report) return;

    try {
      const { data: behavior } = await supabase.rpc("get_reporter_behavior", {
        p_reporter_id: report.reporter_id || null,
        p_reporter_ip: report.reporter_ip_address || null,
      });
      setReporterBehavior(behavior);
    } catch (error) {
      console.error("Error loading reporter behavior:", error);
    }
  };

  const loadPreviousReports = async () => {
    if (!report) return;

    try {
      const { data: previousStatus } = await supabase.rpc(
        "check_previous_report_status",
        {
          p_post_id: report.reported_post_id || null,
          p_topic_id: report.reported_topic_id || null,
        }
      );
      setPreviousReports(previousStatus);
    } catch (error) {
      console.error("Error loading previous reports:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!report) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ admin_notes: adminNotes.trim() || null })
        .eq("id", report.id);

      if (error) throw error;

      toast({
        title: "Notes saved",
        description: "Admin notes have been updated successfully",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!report) return;

    setIsUpdating(true);
    try {
      // Add specific notes for repeat reports
      let finalNotes = adminNotes.trim() || "";
      if (previousReports?.was_previously_approved && status === "dismissed") {
        finalNotes = finalNotes
          ? `${finalNotes}\n\n[Auto] Dismissed repeat report on previously approved content.`
          : "[Auto] Dismissed repeat report on previously approved content.";
      }

      const { error } = await supabase
        .from("reports")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          admin_notes: finalNotes || null,
        })
        .eq("id", report.id);

      if (error) throw error;

      toast({
        title: "Report updated",
        description: `Report has been ${status}`,
      });
      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestoreContent = async () => {
    if (!report) return;

    setIsUpdating(true);
    try {
      // Restore the content by setting moderation status to approved
      if (report.reported_post_id) {
        const { error } = await supabase
          .from("posts")
          .update({ moderation_status: "approved" })
          .eq("id", report.reported_post_id);
        if (error) throw error;
      } else if (report.reported_topic_id) {
        const { error } = await supabase
          .from("topics")
          .update({ moderation_status: "approved" })
          .eq("id", report.reported_topic_id);
        if (error) throw error;
      }

      // Update report status to resolved
      const { error: reportError } = await supabase
        .from("reports")
        .update({
          status: "resolved",
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes.trim() || null,
        })
        .eq("id", report.id);

      if (reportError) throw reportError;

      toast({
        title: "Content restored",
        description:
          "The reported content has been approved and is now visible",
      });
      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore content",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!report) return;

    // Replaced window.confirm with a custom modal for better UI/UX and Next.js compatibility
    // You would typically implement a custom confirmation dialog component here
    const confirmed = await new Promise((resolve) => {
      // This is a placeholder for a custom confirmation dialog.
      // In a real application, you would render a dialog component
      // and pass resolve/reject functions to its buttons.
      const userConfirmed = window.confirm(
        `Are you sure you want to permanently delete this ${
          report.reported_post_id ? "post" : "topic"
        }? This action cannot be undone.`
      );
      resolve(userConfirmed);
    });

    if (!confirmed) return;

    setIsUpdating(true);
    try {
      // Delete the content
      if (report.reported_post_id) {
        const { error } = await supabase
          .from("posts")
          .delete()
          .eq("id", report.reported_post_id);
        if (error) throw error;
      } else if (report.reported_topic_id) {
        const { error } = await supabase
          .from("topics")
          .delete()
          .eq("id", report.reported_topic_id);
        if (error) throw error;
      }

      // Update report status
      const { error: reportError } = await supabase
        .from("reports")
        .update({
          status: "resolved",
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes.trim() || null,
        })
        .eq("id", report.id);

      if (reportError) throw reportError;

      toast({
        title: "Content deleted",
        description: "The reported content has been permanently removed",
      });
      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete content",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getReportedContentUrl = (report: any) => {
    if (report.reported_post_id && report.post) {
      if (report.post.topic?.category_slug && report.post.topic?.slug) {
        return `/category/${report.post.topic.category_slug}/${report.post.topic.slug}`;
      }
      return `/topic/${report.post.topic_id}`;
    } else if (report.reported_topic_id && report.topic) {
      if (report.topic.category_slug && report.topic.slug) {
        return `/category/${report.topic.category_slug}/${report.topic.slug}`;
      }
      return `/topic/${report.topic.id}`;
    }
    return "#";
  };

  const formatIPAddress = (ip: string | null) => {
    if (!ip) return "Not available";
    return ip;
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  report.status === "pending"
                    ? "destructive"
                    : report.status === "resolved"
                    ? "default"
                    : "secondary"
                }
              >
                {report.status}
              </Badge>
              <Badge
                variant="outline"
                className={
                  report.post?.moderation_status === "pending" ||
                  report.topic?.moderation_status === "pending"
                    ? "border-orange-500 text-orange-700"
                    : "border-green-500 text-green-700"
                }
              >
                Content:{" "}
                {report.post?.moderation_status ||
                  report.topic?.moderation_status ||
                  "approved"}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              Reported {formatDistanceToNow(new Date(report.created_at))} ago
            </span>
          </div>

          {/* Reporter Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Reporter Information</h3>
              {reporterBehavior?.is_problematic_reporter && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Problematic Reporter
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Username</Label>
                <p className="font-medium">
                  {report.reporter?.username || "Anonymous"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">IP Address</Label>
                <p className="font-mono text-sm">
                  {formatIPAddress(report.reporter_ip_address)}
                </p>
              </div>
            </div>

            {/* Reporter Behavior Stats */}
            {reporterBehavior && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">Reporter Activity</Label>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Total Reports</p>
                    <p className="font-semibold">
                      {reporterBehavior.total_reports}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Today</p>
                    <p className="font-semibold">
                      {reporterBehavior.reports_today}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dismissed</p>
                    <p className="font-semibold">
                      {reporterBehavior.dismissed_reports}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-semibold">
                      {reporterBehavior.total_reports > 0
                        ? Math.round(
                            (1 -
                              reporterBehavior.dismissed_reports /
                                reporterBehavior.total_reports) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                {reporterBehavior.recent_repeat_reports > 0 && (
                  <Alert className="mt-2 border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 text-xs">
                      This reporter has made{" "}
                      {reporterBehavior.recent_repeat_reports} reports on
                      previously approved content in the last 24 hours.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Previous Reports Warning */}
            {previousReports?.was_previously_approved && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Repeat Report:</strong> This content was previously
                  reviewed and approved
                  {previousReports.last_approved_at && (
                    <span>
                      {" "}
                      on{" "}
                      {new Date(
                        previousReports.last_approved_at
                      ).toLocaleDateString()}
                    </span>
                  )}
                  . Total reports on this content:{" "}
                  {previousReports.total_reports}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Content Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Reported Content</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <Badge
                  variant={report.reported_post_id ? "secondary" : "default"}
                >
                  {report.reported_post_id ? "Post" : "Topic"}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Author</Label>
                <p className="font-medium">
                  {report.contentAuthor?.username || "Anonymous User"}
                </p>
              </div>
            </div>

            {/* Full Content Display */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground font-medium">
                  Full Content
                </Label>
                <Link
                  href={getReportedContentUrl(report)} // Changed 'to' to 'href'
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  target="_blank" // Open in new tab
                  rel="noopener noreferrer" // Security best practice for target="_blank"
                >
                  View on site <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="border rounded-md p-4 bg-muted/50 max-h-80 overflow-y-auto">
                {report.topic?.title && (
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground">
                      Title:
                    </Label>
                    <h4 className="font-semibold text-base">
                      {report.topic.title}
                    </h4>
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-sm">
                    {report.post?.content ||
                      report.topic?.content ||
                      "No content available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Creator IP (if available) */}
            {(report.post?.ip_address || report.topic?.author_id) && (
              <div className="mt-2">
                <Label className="text-muted-foreground">
                  Content Creator IP
                </Label>
                <p className="font-mono text-sm">
                  {formatIPAddress(
                    report.post?.ip_address ||
                      report.topic?.ip_address ||
                      "Not available"
                  )}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Report Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">Report Details</h3>
            <div>
              <Label className="text-muted-foreground">Reason</Label>
              <p className="font-medium">{report.reason}</p>
            </div>
            {report.description && (
              <div>
                <Label className="text-muted-foreground">
                  Additional Details
                </Label>
                <p className="text-sm whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Admin Notes */}
          <div className="space-y-3">
            <Label htmlFor="admin-notes" className="font-semibold">
              Admin Notes
            </Label>
            <Textarea
              id="admin-notes"
              placeholder="Add your notes about this report..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={isUpdating}
              className="w-fit"
            >
              <Save className="h-3 w-3 mr-1" />
              Save Notes
            </Button>
          </div>

          {/* Content Management Actions */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="font-semibold mb-3">Content Management</h3>
            <div className="flex gap-3">
              <Button
                onClick={handleRestoreContent}
                disabled={isUpdating}
                className="flex-1"
                variant="default"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Content
              </Button>
              <Button
                onClick={handleDeleteContent}
                disabled={isUpdating}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Content
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Restore will approve the content and make it visible. Delete will
              permanently remove it.
            </p>
          </div>

          {/* Report Status Actions */}
          {report.status === "pending" && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Report Actions</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate("dismissed")}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Dismiss Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate("closed")}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Report
                </Button>
              </div>

              {/* Quick Actions for Repeat Reports */}
              {previousReports?.was_previously_approved && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 mb-2">
                    <strong>Quick Action:</strong> This appears to be a repeat
                    report on approved content.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAdminNotes((prev) =>
                        prev
                          ? `${prev}\n\nContent was previously approved. Dismissing repeat report.`
                          : "Content was previously approved. Dismissing repeat report."
                      );
                      handleStatusUpdate("dismissed");
                    }}
                    disabled={isUpdating}
                    className="text-amber-700 border-amber-300 hover:bg-amber-100"
                  >
                    Auto-Dismiss Repeat Report
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
