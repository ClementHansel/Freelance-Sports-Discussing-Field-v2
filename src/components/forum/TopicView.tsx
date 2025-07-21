"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { HTMLRenderer } from "@/components/ui/html-renderer";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  MessageSquare,
  User,
  Clock,
  ArrowLeft,
  ThumbsUp,
  Flag,
  Reply,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Share,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTopic } from "@/hooks/useTopic";
import { useTopicByPath } from "@/hooks/useTopicByPath";
import { usePosts } from "@/hooks/usePosts";
import { useEditTopic } from "@/hooks/useEditTopic";
import { usePostPage } from "@/hooks/usePostPage";
import { usePollsByTopic } from "@/hooks/usePollResults";
import { ReportModal } from "./ReportModal";
import { PostComponent } from "./PostComponent";
import { InlineReplyForm } from "./InlineReplyForm";

import { PollDisplay } from "./PollDisplay";
import { AdBanner } from "@/components/ads/AdBanner";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Topic as TopicInterface } from "@/hooks/useTopics";
import { Post as PostInterface } from "@/hooks/usePosts";
import { AdminControls } from "./admin-ui/AdminControls";

// Define a more comprehensive type for the topic data received from hooks
// This combines properties from useTopic and useTopicByPath and matches Supabase query results
interface FullTopicDetails {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  category_id: string;
  is_pinned: boolean | null;
  is_locked: boolean | null;
  is_hidden: boolean | null; // Explicitly included
  created_at: string;
  updated_at: string;
  vote_score: number | null;
  moderation_status: "pending" | "approved" | "rejected" | null; // Explicitly included
  ip_address?: unknown;
  is_anonymous?: boolean | null;
  view_count?: number | null;
  reply_count?: number | null;
  slug: string | null;
  hot_score: number | null; // Explicitly included
  last_post_id?: string | null;
  last_reply_at?: string | null;
  canonical_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;

  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
  temporary_users?: {
    display_name: string;
  } | null;
  categories?: {
    id: string; // Crucial addition based on useTopicByPath's select
    name: string;
    color: string;
    slug: string;
    parent_category_id?: string | null;
    parent_category?: {
      slug: string | null;
      name: string | null;
    } | null;
  } | null;
}

export const TopicView = () => {
  // Next.js useParams gives an object. Access slugs directly from it.
  const params = useParams();
  const categorySlug = params.categorySlug as string | undefined;
  const subcategorySlug = params.subcategorySlug as string | undefined; // Assuming this is a catch-all route for subcategories
  const topicSlug = params.topicSlug as string | undefined; // Assuming this is a dynamic route segment
  const topicId = params.topicId as string | undefined; // If you still use ID-based routes, though slug is preferred.

  const router = useRouter(); // Next.js router for navigation
  const searchParams = useSearchParams(); // Next.js search params

  const { user } = useAuth();
  const [showTopicReply, setShowTopicReply] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Pagination state
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const postsPerPage = 20;

  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    postId?: string;
    topicId?: string;
    contentType: "post" | "topic";
  }>({
    isOpen: false,
    contentType: "post",
  });

  // Handle both legacy UUID routing and new slug routing
  // Prioritize slug routing if available, otherwise fall back to topicId
  const isLegacyRoute = !!topicId; // Check if topicId param is present
  const {
    data: legacyTopic,
    isLoading: legacyLoading,
    error: legacyError,
  } = useTopic(topicId || ""); // Fetch by ID if legacy route
  const {
    data: slugTopic,
    isLoading: slugLoading,
    error: slugError,
  } = useTopicByPath(categorySlug || "", subcategorySlug, topicSlug); // Fetch by path

  // Determine which topic data to use, explicitly typing it as FullTopicDetails | null | undefined
  const topic: FullTopicDetails | null | undefined = isLegacyRoute
    ? (legacyTopic as FullTopicDetails) // Access the data property of the useQuery result and cast
    : (slugTopic as FullTopicDetails); // Access the data property of the useQuery result and cast

  // Topic moderation status state - initialized after topic is defined
  const [topicModerationStatus, setTopicModerationStatus] = useState(
    topic?.moderation_status
  );
  const [isTopicVisible, setIsTopicVisible] = useState(
    topic?.moderation_status === "approved"
  );
  const topicLoading = isLegacyRoute ? legacyLoading : slugLoading;
  const topicError = isLegacyRoute ? legacyError : slugError;

  const { data: postsData, isLoading: postsLoading } = usePosts(
    topic?.id || "",
    {
      page: currentPage,
      limit: postsPerPage,
    }
  );

  // Memoize posts to prevent unnecessary re-renders and address ESLint warning
  const posts: PostInterface[] = useMemo(
    () => postsData?.posts || [],
    [postsData]
  );
  const totalPosts = postsData?.totalCount || 0;
  const { mutate: editTopic, isPending: isUpdatingTopic } = useEditTopic();
  const { data: polls = [] } = usePollsByTopic(topic?.id || "");

  // Real-time subscription for topic moderation status changes
  useEffect(() => {
    if (!topic?.id) return;

    const channel = supabase
      .channel(`topic-moderation-${topic.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "topics",
          filter: `id=eq.${topic.id}`,
        },
        (payload) => {
          if (payload.new) {
            const newStatus = payload.new.moderation_status;
            setTopicModerationStatus(newStatus);
            setIsTopicVisible(newStatus === "approved");

            if (newStatus === "pending") {
              toast({
                title: "Topic flagged",
                description:
                  "This topic has been flagged and is now under review.",
                variant: "default",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topic?.id]); // Removed 'toast' from dependencies as it's stable

  // Update local state when topic data changes
  useEffect(() => {
    if (topic) {
      setTopicModerationStatus(topic.moderation_status);
      setIsTopicVisible(topic.moderation_status === "approved");
    }
  }, [topic]);

  const handleReport = (
    contentType: "post" | "topic",
    postId?: string,
    topicId?: string
  ) => {
    setReportModal({
      isOpen: true,
      contentType,
      postId,
      topicId,
    });
  };

  const handleEditTopic = () => {
    setEditTitle(topic?.title || "");
    setEditContent(topic?.content || "");
    setIsEditingTopic(true);
  };

  const handleSaveTopic = () => {
    if (!topic || !editTitle.trim()) return;

    editTopic(
      {
        topicId: topic.id,
        title: editTitle.trim(),
        content: editContent.trim(),
      },
      {
        onSuccess: () => {
          setIsEditingTopic(false);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditingTopic(false);
    setEditTitle("");
    setEditContent("");
  };

  const canEditTopic =
    user &&
    (user.id === topic?.author_id ||
      user.role === "admin" ||
      user.role === "moderator");

  const handlePageChange = useCallback(
    (page: number) => {
      const current = new URLSearchParams(searchParams.toString());
      current.set("page", page.toString());
      // Use router.push to update the URL without a full page reload
      router.push(`${window.location.pathname}?${current.toString()}`);
    },
    [searchParams, router]
  );

  // Extract post ID from hash for cross-page navigation - make it reactive
  const [hashPostId, setHashPostId] = useState(() => {
    // Check window.location.hash only on client side
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#post-")) {
        return hash.substring("#post-".length);
      }
    }
    return null;
  });

  // Listen for hash changes to update hashPostId
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#post-")) {
        setHashPostId(hash.substring("#post-".length));
      } else {
        setHashPostId(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Use the hook to find the correct page for the post
  const { data: postPageInfo, isLoading: isLoadingPostPage } = usePostPage(
    topic?.id || "",
    hashPostId || "",
    postsPerPage
  );

  // Handle cross-page navigation and scrolling to specific posts
  useEffect(() => {
    if (!topic?.id || postsLoading) return;

    const hash = window.location.hash;
    if (!hash) return;

    const targetId = hash.substring(1); // Remove the # symbol

    const scrollToElement = (elementId: string, retries = 3) => {
      const element = document.getElementById(elementId);
      if (element) {
        console.log("Scrolling to element:", elementId);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (retries > 0) {
        console.log(
          "Element not found, retrying...",
          elementId,
          "retries left:",
          retries
        );
        setTimeout(() => scrollToElement(elementId, retries - 1), 100);
      } else {
        console.log("Element not found after retries:", elementId);
      }
    };

    if (targetId.startsWith("post-")) {
      // Handle specific post
      const postId = targetId.substring("post-".length);

      // If we have page info and need to navigate to a different page
      if (postPageInfo && postPageInfo.page !== currentPage) {
        console.log(
          "Navigating to page:",
          postPageInfo.page,
          "for post:",
          postId
        );
        handlePageChange(postPageInfo.page);
        return; // Exit early, the page change will trigger this effect again
      }

      // If we're on the right page, scroll to the post
      if (posts && posts.length > 0) {
        console.log(
          "Attempting to scroll to post:",
          targetId,
          "on current page"
        );
        requestAnimationFrame(() => {
          setTimeout(() => scrollToElement(targetId), 300);
        });
      }
    }
  }, [
    posts,
    topic?.id,
    postPageInfo,
    currentPage,
    handlePageChange,
    postsLoading,
  ]);

  const organizeReplies = (posts: PostInterface[]) => {
    // Typed 'posts' parameter
    // Create a flat list sorted by creation time to maintain chronological order
    // All posts will be rendered at the same visual level, but parent relationships are preserved for quoting
    return posts.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  if (topicLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (topicError || !topic) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Topic not found</h2>
        <p className="text-gray-600 mt-2">
          The topic you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  // Don't render topic content if it's not visible (pending/rejected)
  if (!isTopicVisible && topicModerationStatus !== "approved") {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">
          {topicModerationStatus === "pending"
            ? "Topic Under Review"
            : "Topic Unavailable"}
        </h2>
        <p className="text-gray-600 mt-2">
          {topicModerationStatus === "pending"
            ? "This topic has been flagged and is currently under review by our moderation team."
            : "This topic has been removed by moderators."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Breadcrumb - desktop only */}
      <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Forum
        </Link>
        <span>/</span>
        <Link
          href={`/category/${topic.categories?.slug}`}
          className="hover:text-primary"
        >
          {topic.categories?.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{topic.title}</span>
      </div>

      {/* Back Button - mobile optimized */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          router.back(); // Use Next.js router.back()
        }}
        className="md:hidden"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Topic Header */}
      <div className="bg-card border-b border-border">
        <div className="p-3 md:p-6">
          <div className="space-y-4">
            {/* Category and meta */}
            <div className="flex items-center flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  borderColor: topic.categories?.color ?? "", // Handle null
                  color: topic.categories?.color ?? "", // Handle null
                  backgroundColor: `${topic.categories?.color ?? ""}10`, // Handle null
                }}
              >
                {topic.categories?.name}
              </Badge>
            </div>

            {/* Title */}
            {isEditingTopic ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg md:text-2xl font-bold"
                placeholder="Topic title"
              />
            ) : (
              <div className="flex items-center justify-between">
                <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">
                  {topic.title}
                </h1>
                <AdminControls
                  content={topic}
                  contentType="topic"
                  onDelete={() => router.push("/")} // Use router.push
                />
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center flex-wrap gap-3 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 md:h-4 md:w-4" />
                <span>{topic.profiles?.username || "Anonymous User"}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>
                Created {formatDistanceToNow(new Date(topic.created_at ?? ""))}{" "}
                ago {/* Handle null */}
              </span>
              {topic.last_reply_at &&
                topic.reply_count &&
                topic.reply_count > 0 && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    {topic.last_post_id ? (
                      <Link
                        href={`#post-${topic.last_post_id}`}
                        className="hover:text-primary transition-colors"
                      >
                        Last reply{" "}
                        {formatDistanceToNow(
                          new Date(topic.last_reply_at ?? "")
                        )}{" "}
                        ago {/* Handle null */}
                      </Link>
                    ) : (
                      <span>
                        Last reply{" "}
                        {formatDistanceToNow(
                          new Date(topic.last_reply_at ?? "")
                        )}{" "}
                        ago {/* Handle null */}
                      </span>
                    )}
                  </>
                )}
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                <span>{topic.reply_count || 0} comments</span>
              </div>
            </div>

            {/* Content */}
            {isEditingTopic ? (
              <div className="bg-muted/30 rounded-md p-3 md:p-4 border border-border/50 mb-4">
                <WysiwygEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Topic content (optional)"
                  height={200}
                  allowImages={!!user}
                  hideToolbar={!user}
                />
              </div>
            ) : topic.content ? (
              <div className="bg-muted/30 rounded-md p-3 md:p-4 border border-border/50 mb-4">
                <div className="text-foreground text-sm md:text-base">
                  <HTMLRenderer content={topic.content} />
                </div>
              </div>
            ) : null}

            {/* Save/Cancel buttons for editing */}
            {isEditingTopic && (
              <div className="flex items-center gap-2 mb-4">
                <Button
                  size="sm"
                  onClick={handleSaveTopic}
                  disabled={isUpdatingTopic || !editTitle.trim()}
                >
                  {isUpdatingTopic ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdatingTopic}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Action bar - consistent with PostComponent */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Edit button - only for authors and moderators */}
              {canEditTopic && !isEditingTopic && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={handleEditTopic}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}

              {/* Reply button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => setShowTopicReply(!showTopicReply)}
              >
                <MessageCircle className="h-3 w-3" />
              </Button>

              {/* Reply count */}
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{topic.reply_count || 0}</span>
              </div>

              {/* Share button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  const shareUrl =
                    topic.categories?.slug && topic.slug
                      ? `${window.location.origin}/category/${topic.categories.slug}/${topic.slug}` // Updated URL structure for Next.js
                      : `${window.location.origin}/topic/${topic.id}`; // Fallback for legacy ID-based topics
                  const shareData = {
                    title: topic.title,
                    text: `Check out this topic: ${topic.title}`,
                    url: shareUrl,
                  };

                  if (
                    navigator.share &&
                    navigator.canShare &&
                    navigator.canShare(shareData)
                  ) {
                    navigator
                      .share(shareData)
                      .then(() => {
                        toast({
                          title: "Shared successfully!",
                          description:
                            "Topic shared using your device's share menu",
                        });
                      })
                      .catch((error: unknown) => {
                        // Changed error: any to error: unknown
                        if (
                          error instanceof Error &&
                          error.name !== "AbortError"
                        ) {
                          // Fallback to clipboard if share fails or is aborted
                          // Using document.execCommand('copy') for broader compatibility in iframes
                          const textArea = document.createElement("textarea");
                          textArea.value = shareUrl;
                          document.body.appendChild(textArea);
                          textArea.select();
                          try {
                            document.execCommand("copy");
                            toast({
                              title: "Link copied!",
                              description:
                                "Topic link has been copied to clipboard",
                            });
                          } catch (err) {
                            toast({
                              title: "Share failed",
                              description: "Could not copy link to clipboard",
                              variant: "destructive",
                            });
                          } finally {
                            document.body.removeChild(textArea);
                          }
                        }
                      });
                  } else {
                    // Fallback for browsers that don't support Web Share API
                    const textArea = document.createElement("textarea");
                    textArea.value = shareUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                      document.execCommand("copy");
                      toast({
                        title: "Link copied!",
                        description: "Topic link has been copied to clipboard",
                      });
                    } catch (err) {
                      toast({
                        title: "Share failed",
                        description: "Could not copy link to clipboard",
                        variant: "destructive",
                      });
                    } finally {
                      document.body.removeChild(textArea);
                    }
                  }
                }}
              >
                <Share className="h-3 w-3" />
              </Button>

              {/* Report button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleReport("topic", undefined, topic.id)}
              >
                <Flag className="h-3 w-3 fill-current" />
              </Button>
            </div>
          </div>
        </div>

        {/* Reply to topic form - inline */}
        {showTopicReply && (
          <div className="border-t border-border p-3 md:p-6 bg-primary/5">
            <InlineReplyForm
              topicId={topic.id || ""}
              parentPostId={null}
              parentPost={topic}
              onCancel={() => setShowTopicReply(false)}
              onSuccess={() => setShowTopicReply(false)}
              isTopicReply={true}
            />
          </div>
        )}
      </div>

      {/* Polls */}
      {polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollDisplay key={poll.id} poll={poll} />
          ))}
        </div>
      )}

      {/* Comments */}
      <div className="bg-card">
        <div className="p-3 md:p-6 border-b border-border">
          <h2 className="text-base md:text-lg font-semibold text-foreground">
            Comments ({totalPosts})
          </h2>
        </div>

        {postsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-1">
            {organizeReplies(posts).map((reply, index) => (
              <React.Fragment key={reply.id}>
                <PostComponent
                  post={reply}
                  topicId={topic.id || ""}
                  depth={0}
                  onReport={handleReport}
                />
                {/* Insert ad banner every 4 comments (desktop only) */}
                {(index + 1) % 4 === 0 && index < posts.length - 1 && (
                  <AdBanner />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 px-3">
            No replies yet. Be the first to reply!
          </p>
        )}

        {/* Pagination Controls */}
        {totalPosts > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={Math.ceil(totalPosts / postsPerPage)}
            totalItems={totalPosts}
            itemsPerPage={postsPerPage}
            onPageChange={handlePageChange}
            loading={postsLoading}
          />
        )}
      </div>

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        postId={reportModal.postId}
        topicId={reportModal.topicId}
        contentType={reportModal.contentType}
      />
    </div>
  );
};
