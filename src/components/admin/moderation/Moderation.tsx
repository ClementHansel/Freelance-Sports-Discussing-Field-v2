// src/app/(admin)/moderation/page.tsx
"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  UserX,
  Wifi,
  WifiOff,
  Eye,
  X,
  Trash2,
  Users,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Import all necessary interfaces from the shared types file
import {
  CategorySlug,
  TopicForReport,
  PostForReport,
  ReporterProfile,
  ContentAuthorProfile,
  SupabaseReportRow,
  Report,
  SupabaseModerationItemRaw, // FIX: Correctly import SupabaseModerationItemRaw (now a union)
  ModerationItem,
  SupabasePostRaw,
  SupabaseTopicRaw,
} from "@/types/admin-moderation";

import { ModerationItemDetailsModal } from "@/components/dashboard/admin/ModerationItemDetailsModal";
import { ReportDetailsModal } from "@/components/dashboard/admin/ReportDetailsModal";
import { CategoryRequestsManager } from "@/components/dashboard/admin/CategoryRequestsManager";

const ReportsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Helper function to generate the correct URL for reported content
  const getReportedContentUrl = (report: Report) => {
    if (report.reported_post_id && report.post && report.post.topics) {
      // For posts, navigate to the parent topic
      if (report.post.topics.categories?.slug && report.post.topics.slug) {
        return `/category/${report.post.topics.categories.slug}/${report.post.topics.slug}`;
      }
      return `/topic/${report.post.topic_id}`;
    } else if (report.reported_topic_id && report.topic) {
      // For topics, use category/topic slug pattern
      if (report.topic.categories?.slug && report.topic.slug) {
        return `/category/${report.topic.categories.slug}/${report.topic.slug}`;
      }
      return `/topic/${report.topic.id}`;
    }
    return "#";
  };

  // Query for active reports (pending status)
  const {
    data: activeReports,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useQuery<Report[]>({
    queryKey: ["reports", "active"],
    queryFn: async () => {
      const { data: reportsDataRaw, error: reportsError } = await supabase
        .from("reports")
        .select("*, admin_notes, reporter_ip_address")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;

      // Cast raw data to SupabaseReportRow[]
      const reportsData: SupabaseReportRow[] =
        reportsDataRaw as SupabaseReportRow[];

      // Fetch reporter profiles
      const reporterIds = reportsData
        .map((r) => r.reporter_id)
        .filter(Boolean) as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", reporterIds);

      // Fetch posts with topic and category info for navigation
      const postIds = reportsData
        .map((r) => r.reported_post_id)
        .filter(Boolean) as string[];
      const { data: postsRaw } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          author_id,
          topic_id,
          ip_address,
          created_at,
          topics!inner (
            id,
            title,
            content,
            author_id,
            slug,
            categories!inner (
              slug
            )
          )
        `
        )
        .in("id", postIds);

      // Cast postsRaw to an array of objects that match PostForReport's structure,
      // explicitly handling ip_address to be string | null
      const posts: PostForReport[] = (
        (postsRaw as SupabasePostRaw[]) || []
      ).map((p) => ({
        id: p.id,
        content: p.content,
        author_id: p.author_id,
        topic_id: p.topic_id,
        ip_address: p.ip_address as string | null,
        created_at: p.created_at,
        topics: p.topics as TopicForReport | null,
      }));

      // Fetch topics with category info for navigation
      const topicIds = reportsData
        .map((r) => r.reported_topic_id)
        .filter(Boolean) as string[];
      const { data: topics } = await supabase
        .from("topics")
        .select(
          `
          id,
          title,
          content,
          author_id,
          slug,
          created_at,
          categories!inner (
            slug
          )
        `
        )
        .in("id", topicIds);

      // Get author profiles for reported content
      const allAuthorIds = [
        ...(posts?.map((p) => p.author_id) || []),
        ...(topics?.map((t) => t.author_id) || []),
      ].filter(Boolean) as string[];

      const { data: authorProfiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", allAuthorIds);

      // Combine the data
      const enrichedReports: Report[] = reportsData.map((report) => ({
        ...report,
        status: report.status as Report["status"],
        reporter: profiles?.find((p) => p.id === report.reporter_id),
        post: posts?.find((p) => p.id === report.reported_post_id),
        topic: topics?.find((t) => t.id === report.reported_topic_id),
        contentAuthor: authorProfiles?.find(
          (p) =>
            p.id ===
            (posts?.find((po) => po.id === report.reported_post_id)
              ?.author_id ||
              topics?.find((to) => to.id === report.reported_topic_id)
                ?.author_id)
        ),
      }));

      return enrichedReports;
    },
  });

  // Query for resolved reports (resolved, dismissed, closed status)
  const {
    data: resolvedReports,
    isLoading: resolvedLoading,
    refetch: refetchResolved,
  } = useQuery<Report[]>({
    queryKey: ["reports", "resolved"],
    queryFn: async () => {
      const { data: reportsDataRaw, error: reportsError } = await supabase
        .from("reports")
        .select("*, admin_notes, reporter_ip_address")
        .in("status", ["resolved", "dismissed", "closed"])
        .order("reviewed_at", { ascending: false });

      if (reportsError) throw reportsError;

      // Cast raw data to SupabaseReportRow[]
      const reportsData: SupabaseReportRow[] =
        reportsDataRaw as SupabaseReportRow[];

      // Fetch reporter profiles
      const reporterIds = reportsData
        .map((r) => r.reporter_id)
        .filter(Boolean) as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", reporterIds);

      // Fetch posts with topic and category info for navigation
      const postIds = reportsData
        .map((r) => r.reported_post_id)
        .filter(Boolean) as string[];
      const { data: postsRaw } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          author_id,
          topic_id,
          ip_address,
          created_at,
          topics!inner (
            id,
            title,
            content,
            author_id,
            slug,
            categories!inner (
              slug
            )
          )
        `
        )
        .in("id", postIds);

      // Cast postsRaw to an array of objects that match PostForReport's structure,
      // explicitly handling ip_address to be string | null
      const posts: PostForReport[] = (
        (postsRaw as SupabasePostRaw[]) || []
      ).map((p) => ({
        id: p.id,
        content: p.content,
        author_id: p.author_id,
        topic_id: p.topic_id,
        ip_address: p.ip_address as string | null,
        created_at: p.created_at,
        topics: p.topics as TopicForReport | null,
      }));

      // Fetch topics with category info for navigation
      const topicIds = reportsData
        .map((r) => r.reported_topic_id)
        .filter(Boolean) as string[];
      const { data: topics } = await supabase
        .from("topics")
        .select(
          `
          id,
          title,
          content,
          author_id,
          slug,
          created_at,
          categories!inner (
            slug
          )
        `
        )
        .in("id", topicIds);

      // Get author profiles for reported content
      const allAuthorIds = [
        ...(posts?.map((p) => p.author_id) || []),
        ...(topics?.map((t) => t.author_id) || []),
      ].filter(Boolean) as string[];

      const { data: authorProfiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", allAuthorIds);

      // Combine the data
      const enrichedReports: Report[] = reportsData.map((report) => ({
        ...report,
        status: report.status as Report["status"],
        reporter: profiles?.find((p) => p.id === report.reporter_id),
        post: posts?.find((p) => p.id === report.reported_post_id),
        topic: topics?.find((t) => t.id === report.reported_topic_id),
        contentAuthor: authorProfiles?.find(
          (p) =>
            p.id ===
            (posts?.find((po) => po.id === report.reported_post_id)
              ?.author_id ||
              topics?.find((to) => to.id === report.reported_topic_id)
                ?.author_id)
        ),
      }));

      return enrichedReports;
    },
  });

  const currentReports =
    activeTab === "active" ? activeReports : resolvedReports;
  const isLoading = activeTab === "active" ? activeLoading : resolvedLoading;

  const handleResolveReport = async (
    reportId: string,
    action: "resolved" | "dismissed"
  ) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Report updated",
        description: `Report has been ${action}`,
      });

      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports-count"] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update report",
        variant: "destructive",
      });
    }
  };

  const handleCloseReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: "closed",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Report closed",
        description: "Report has been closed",
      });

      queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to close report",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    // FIX: Replace confirm() with a custom modal in a real app
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this report?"
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "Report has been permanently deleted",
      });

      queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const handleViewReportDetails = (report: Report) => {
    setSelectedReport(report);
    setIsReportModalOpen(true);
  };

  const handleReportUpdate = () => {
    refetchActive();
    refetchResolved();
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading reports...</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">User Reports</h2>
          <div className="text-sm text-muted-foreground">
            Reports on live content from community members
          </div>
        </div>

        <Suspense
          fallback={
            <Card className="p-6">
              <div className="text-center">Loading content table...</div>
            </Card>
          }
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active Reports
                {activeReports && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {activeReports.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved Reports
                {resolvedReports && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {resolvedReports.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Reports requiring attention from community members
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reporter IP</TableHead>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Content IP</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.reporter?.username || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {String(report.reporter_ip_address || "N/A")}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.reported_post_id ? "secondary" : "default"
                          }
                        >
                          {report.reported_post_id ? "Post" : "Topic"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.reason}</div>
                          {report.description && (
                            <div className="text-sm text-muted-foreground">
                              {report.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <Link
                          href={getReportedContentUrl(report)}
                          className="text-primary hover:text-primary/80 hover:underline block"
                        >
                          <div className="truncate text-sm font-medium">
                            {report.post?.content ||
                              report.topic?.content ||
                              report.topic?.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Click to view content
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.contentAuthor?.username || "Anonymous User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {report.post ? "Post author" : "Topic author"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {String(report.post?.ip_address || "N/A")}
                        </code>
                      </TableCell>
                      <TableCell>
                        {report.created_at
                          ? formatDistanceToNow(new Date(report.created_at)) +
                            " ago"
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReportDetails(report)}
                            className="text-blue-600 hover:text-blue-700"
                            title="View details"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleResolveReport(report.id, "resolved")
                            }
                            className="text-green-600 hover:text-green-700"
                            title="Mark as resolved"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleResolveReport(report.id, "dismissed")
                            }
                            className="text-gray-600 hover:text-gray-700"
                            title="Dismiss report"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete report permanently"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!currentReports || currentReports.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground"
                      >
                        No active reports to display
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Previously handled reports (resolved, dismissed, or closed)
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resolved</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.reporter?.username || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.reported_post_id ? "secondary" : "default"
                          }
                        >
                          {report.reported_post_id ? "Post" : "Topic"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.reason}</div>
                          {report.description && (
                            <div className="text-sm text-muted-foreground">
                              {report.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <Link
                          href={getReportedContentUrl(report)}
                          className="text-primary hover:text-primary/80 hover:underline block"
                        >
                          <div className="truncate text-sm font-medium">
                            {report.post?.content ||
                              report.topic?.content ||
                              report.topic?.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Click to view content
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.contentAuthor?.username || "Anonymous User"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.status === "resolved"
                              ? "default"
                              : report.status === "dismissed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.reviewed_at
                          ? formatDistanceToNow(new Date(report.reviewed_at)) +
                            " ago"
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReportDetails(report)}
                            className="text-blue-600 hover:text-blue-700"
                            title="View details"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete report permanently"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!currentReports || currentReports.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground"
                      >
                        No resolved reports to display
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>

      <ReportDetailsModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={selectedReport}
        onUpdate={handleReportUpdate}
      />
    </Card>
  );
};

// Changed to default export for Next.js page files
export default function AdminModeration() {
  const { toast } = useToast();
  const [selectedModerationItem, setSelectedModerationItem] =
    useState<ModerationItem | null>(null);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);

  // Query for reports count
  const { data: reportsCount } = useQuery<number>({
    queryKey: ["reports-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching reports count:", error);
        throw error;
      }
      return count || 0;
    },
  });

  // Helper function to generate the correct URL for content items
  const getContentUrl = (item: ModerationItem) => {
    if (item.type === "topic") {
      // For topics, use category/topic slug pattern if available, otherwise fallback to /topic/id
      if (item.category_slug && item.slug) {
        return `/category/${item.category_slug}/${item.slug}`;
      }
      return `/topic/${item.id}`;
    } else {
      // For posts, navigate to the parent topic (posts don't have individual pages)
      if (item.category_slug && item.topic_slug) {
        return `/category/${item.category_slug}/${item.topic_slug}`;
      }
      return `/topic/${item.topic_id}`;
    }
  };

  // Enhanced query to get only pending moderation content
  const {
    data: moderationQueue,
    isLoading,
    refetch,
  } = useQuery<ModerationItem[]>({
    queryKey: ["moderation-queue"],
    queryFn: async () => {
      // Get posts that require moderation (pending status from moderated categories)
      const { data: postsRaw, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          created_at,
          author_id,
          topic_id,
          ip_address,
          is_anonymous,
          moderation_status,
          topics!inner (
            id,
            title,
            content,
            author_id,
            slug,
            categories!inner (
              slug,
              requires_moderation
            )
          )
        `
        )
        .eq("moderation_status", "pending") // Ensure we only get pending items
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      // Cast raw data to SupabasePostRaw[]
      const posts: SupabasePostRaw[] = postsRaw as SupabasePostRaw[];

      // Get topics that require moderation (pending status from moderated categories)
      const { data: topicsRaw, error: topicsError } = await supabase
        .from("topics")
        .select(
          `
          id,
          title,
          content,
          slug,
          created_at,
          author_id,
          moderation_status,
          categories!inner (
            slug,
            requires_moderation
          )
        `
        )
        .eq("moderation_status", "pending") // Ensure we only get pending items
        .order("created_at", { ascending: false });

      if (topicsError) throw topicsError;
      // Cast raw data to SupabaseTopicRaw[]
      const topics: SupabaseTopicRaw[] = topicsRaw as SupabaseTopicRaw[];

      // Get author profiles for both posts and topics
      const allAuthorIds = [
        ...(posts?.map((p) => p.author_id) || []),
        ...(topics?.map((t) => t.author_id) || []),
      ].filter(Boolean) as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", allAuthorIds);

      // Get temporary users
      const { data: tempUsers } = await supabase
        .from("temporary_users")
        .select("id, display_name")
        .in("id", allAuthorIds);

      const getAuthorName = (authorId: string | null) => {
        if (!authorId) return "Anonymous User";
        const profile = profiles?.find((p) => p.id === authorId);
        const tempUser = tempUsers?.find((tu) => tu.id === authorId);
        return profile?.username || tempUser?.display_name || "Anonymous User";
      };

      const items: ModerationItem[] = [
        ...((posts || [])
          .filter(
            (post) =>
              post.moderation_status === "pending" &&
              post.topics?.categories?.requires_moderation // Only include if category requires moderation
          )
          .map((post) => ({
            id: post.id,
            type: "post" as const,
            title: `Reply in: ${post.topics?.title || "Unknown Topic"}`,
            content: post.content || "", // Ensure content is not null
            author: getAuthorName(post.author_id),
            created_at: post.created_at || "", // Ensure created_at is always string
            reported_count: 0, // Not applicable for moderation queue directly
            status: post.moderation_status as ModerationItem["status"],
            is_anonymous: !!post.is_anonymous, // Convert to boolean
            ip_address: post.ip_address as string | null,
            topic_id: post.topic_id || undefined, // FIX: Convert null to undefined
            topic_slug: post.topics?.slug || undefined, // FIX: Convert null to undefined
            category_slug: post.topics?.categories?.slug || undefined, // FIX: Convert null to undefined
          })) || []),
        ...((topics || [])
          .filter(
            (topic) =>
              topic.moderation_status === "pending" &&
              topic.categories?.requires_moderation // Only include if category requires moderation
          )
          .map((topic) => ({
            id: topic.id,
            type: "topic" as const,
            title: topic.title || "", // Ensure title is not null
            content: topic.content || "",
            author: getAuthorName(topic.author_id),
            created_at: topic.created_at || "", // Ensure created_at is always string
            reported_count: 0, // Not applicable for moderation queue directly
            status: topic.moderation_status as ModerationItem["status"],
            is_anonymous: false, // Topics are generally not anonymous in this context
            ip_address: null, // Topics don't usually have a direct IP address column
            slug: topic.slug || undefined, // FIX: Convert null to undefined
            category_slug: topic.categories?.slug || undefined, // FIX: Convert null to undefined
          })) || []),
      ];

      return items.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
    },
  });

  const handleApprove = async (id: string, type: "topic" | "post") => {
    try {
      const { error } = await supabase
        .from(type === "topic" ? "topics" : "posts")
        .update({ moderation_status: "approved" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Content Approved",
        description: `${type} has been approved and is now visible`,
      });

      refetch();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Failed to approve ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async (
    author: string,
    itemId: string,
    type: "topic" | "post"
  ) => {
    if (author === "Anonymous User") {
      toast({
        title: "Cannot Ban Anonymous User",
        description:
          "Anonymous users cannot be banned. Consider IP banning instead.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to ban user: ${author}?`))
      return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", author)
        .single();

      if (profileError) {
        toast({
          title: "Error",
          description: profileError.message || "User not found for banning.",
          variant: "destructive",
        });
        throw profileError;
      }

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "User Banned",
        description: `${author} has been banned successfully`,
      });

      refetch();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleBanIP = async (
    ipAddress: string | null | undefined,
    itemId: string,
    type: "topic" | "post"
  ) => {
    if (!ipAddress) {
      toast({
        title: "No IP Address",
        description: "Cannot ban: No IP address available for this content",
        variant: "destructive",
      });
      return;
    }

    if (
      !window.confirm(`Are you sure you want to ban IP address: ${ipAddress}?`)
    )
      return;

    try {
      const { error: deleteError } = await supabase
        .from(type === "topic" ? "topics" : "posts")
        .delete()
        .eq("id", itemId);

      if (deleteError) throw deleteError;

      toast({
        title: "IP Banned",
        description: `IP address ${ipAddress} has been banned and content removed`,
      });

      refetch();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to ban IP address",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, type: "topic" | "post") => {
    if (!window.confirm(`Are you sure you want to reject this ${type}?`))
      return;

    try {
      const { error } = await supabase
        .from(type === "topic" ? "topics" : "posts")
        .update({ moderation_status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Content Rejected",
        description: `${type} has been rejected and will not be visible`,
      });

      refetch();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Failed to reject ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleViewModerationDetails = (item: ModerationItem) => {
    setSelectedModerationItem(item);
    setIsModerationModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading moderation queue...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate forum content
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">
                {moderationQueue?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Pending Review
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{reportsCount || 0}</div>
              <div className="text-sm text-muted-foreground">
                Pending Reports
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-2xl font-bold">0</div>{" "}
              {/* Placeholder, implement real banned user count */}
              <div className="text-sm text-muted-foreground">Banned Users</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Moderation Queue
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            User Reports
          </TabsTrigger>
          <TabsTrigger
            value="category-requests"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Category Requests
          </TabsTrigger>
          <TabsTrigger value="banned">Banned Content</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Pre-Approval Moderation Queue
                </h2>
                <div className="text-sm text-muted-foreground">
                  Content awaiting approval from moderated categories (Level 1 &
                  2)
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moderationQueue?.map((item: ModerationItem) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.type === "topic" ? "default" : "secondary"
                            }
                          >
                            {item.type}
                          </Badge>
                          {item.is_anonymous && (
                            <Badge variant="outline" className="text-xs">
                              Anon
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <Link
                          href={getContentUrl(item)}
                          className="text-primary hover:text-primary/80 hover:underline font-medium truncate block"
                        >
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>{item.author}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate text-sm text-muted-foreground">
                          {item.content.substring(0, 100)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.ip_address || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewModerationDetails(item)}
                            className="text-blue-600 hover:text-blue-700"
                            title="View full content"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(item.id, item.type)}
                            className="text-green-600 hover:text-green-700"
                            title="Approve content"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleBanUser(item.author, item.id, item.type)
                            }
                            className="text-orange-600 hover:text-orange-700"
                            title="Ban user"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                          {item.ip_address && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleBanIP(item.ip_address, item.id, item.type)
                              }
                              className="text-purple-600 hover:text-purple-700"
                              title="Ban IP address"
                            >
                              <WifiOff className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(item.id, item.type)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove content"
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!moderationQueue || moderationQueue.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No content to moderate
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="category-requests">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Category Requests</h2>
              <p className="text-muted-foreground">
                Review and manage requests for new forum categories
              </p>
            </div>
            <CategoryRequestsManager />
          </div>
        </TabsContent>

        <TabsContent value="banned">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Banned Content</h2>
            <div className="text-center text-muted-foreground py-8">
              No banned content to display.
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <ModerationItemDetailsModal
        isOpen={isModerationModalOpen}
        onClose={() => setIsModerationModalOpen(false)}
        item={selectedModerationItem}
        onApprove={handleApprove}
        onReject={handleReject}
        onBanUser={handleBanUser}
        onBanIP={handleBanIP}
      />
    </div>
  );
}
