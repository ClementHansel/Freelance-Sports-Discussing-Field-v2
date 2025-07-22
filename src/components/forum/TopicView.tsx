"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Post as PostFromHooks } from "@/hooks/usePosts";
import { AdminControls } from "./admin-ui/AdminControls";
import { Post as PostForComponent } from "./PostComponent"; // Import Post type from PostComponent
import { Topic as AdminTopicInfoTopic } from "./admin-ui/AdminTopicInfo"; // Import Topic type from AdminTopicInfo for compatibility

// Define ModerationStatus as it's used in this file
type ModerationStatus = "pending" | "approved" | "rejected";

// Define the type for topic data directly from the useTopic and useTopicByPath hooks
// This type should accurately reflect ALL properties that *might* be present on the fetched topic data,
// even if TopicFromHooks (from a generic useTopics hook) doesn't explicitly list them.
// Assume these properties are indeed returned by the hooks.
interface FetchedTopicData {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  category_id: string;
  created_at: string;
  updated_at: string | null;
  slug: string | null;
  canonical_url: string | null;
  ip_address: string | null; // Corrected type: must be string | null for compatibility
  is_anonymous: boolean | null;
  is_locked: boolean | null;
  is_pinned: boolean | null;
  // Made optional because the error stated they might be "missing" entirely from the source object
  is_hidden?: boolean | null;
  is_public?: boolean | null;
  last_post_id?: string | null;
  last_reply_at: string | null;
  hot_score?: number | null;
  reply_count: number;
  view_count: number;
  moderation_status: string | null; // It's string | null from DB, will be cast to ModerationStatus
  // Expanded profiles to match AdminControls' expected type, and made optional
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    id: string; // Ensure ID is present if used for profile links
    bio: string | null; // Added for AdminControls compatibility
    created_at: string | null; // Added for AdminControls compatibility
    reputation: number | null; // Added for AdminControls compatibility
    updated_at: string | null; // Added for AdminControls compatibility
  } | null; // Made optional and nullable
  temporary_users?: {
    id: string;
    ip_address: string;
    first_seen: string;
    last_seen: string;
  } | null; // Keep optional

  // Added categories property
  categories?: {
    // Made optional as it might be missing from initial fetch
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null; // categories object can be null
}

// FullTopicDetails now correctly extends FetchedTopicData
interface FullTopicDetails extends FetchedTopicData {
  moderation_status: ModerationStatus | null; // Ensure this is the stricter type here.
}

// Ensure PostInterface matches what PostComponent expects, especially for moderation_status
interface PostInterface extends PostFromHooks {
  is_anonymous: boolean | null;
  moderation_status: ModerationStatus | null;
}

export const TopicView = () => {
  const params = useParams();
  const categorySlug = params.categorySlug as string | undefined;
  const subcategorySlug = params.subcategorySlug as string | undefined;
  const topicSlug = params.topicSlug as string | undefined;
  const topicId = params.topicId as string | undefined;

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const [showTopicReply, setShowTopicReply] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

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

  const isLegacyRoute = !!topicId;
  const {
    data: legacyTopic,
    isLoading: legacyLoading,
    error: legacyError,
  } = useTopic(topicId || "");
  const {
    data: slugTopic,
    isLoading: slugLoading,
    error: slugError,
  } = useTopicByPath(categorySlug || "", subcategorySlug, topicSlug);

  const topic: FullTopicDetails | null | undefined = useMemo(() => {
    const fetchedTopic = isLegacyRoute ? legacyTopic : slugTopic;
    if (fetchedTopic) {
      // Safely cast `fetchedTopic` to `FetchedTopicData` first,
      // then ensure specific properties have correct null handling and type casting.
      const topicData = fetchedTopic as FetchedTopicData;
      return {
        ...topicData,
        last_reply_at: topicData.last_reply_at ?? null,
        last_post_id: topicData.last_post_id ?? null,
        moderation_status:
          (topicData.moderation_status as ModerationStatus) ?? null,
        reply_count: topicData.reply_count ?? 0,
        view_count: topicData.view_count ?? 0,
        // Ensure optional fields are handled with nullish coalescing
        is_hidden: topicData.is_hidden ?? null,
        is_public: topicData.is_public ?? null,
        hot_score: topicData.hot_score ?? null,
        profiles: topicData.profiles ?? null,
        categories: topicData.categories ?? null, // Ensure categories is handled
      } as FullTopicDetails; // Final cast to FullTopicDetails
    }
    return fetchedTopic as FullTopicDetails | null | undefined;
  }, [isLegacyRoute, legacyTopic, slugTopic]);

  const [topicModerationStatus, setTopicModerationStatus] =
    useState<ModerationStatus | null>(topic?.moderation_status || null);
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

  const posts: PostInterface[] = useMemo(
    () =>
      (postsData?.posts || []).map((post) => ({
        ...post,
        is_anonymous: post.is_anonymous ?? null,
        moderation_status: (post.moderation_status as ModerationStatus) ?? null, // Cast to ModerationStatus
      })) as PostInterface[],
    [postsData]
  );
  const totalPosts = postsData?.totalCount || 0;
  const { mutate: editTopic, isPending: isUpdatingTopic } = useEditTopic();
  const { data: polls = [] } = usePollsByTopic(topic?.id || "");

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
            setTopicModerationStatus(newStatus as ModerationStatus); // Cast to ModerationStatus
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
  }, [topic?.id]);

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
      router.push(`${window.location.pathname}?${current.toString()}`);
    },
    [searchParams, router]
  );

  const [hashPostId, setHashPostId] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#post-")) {
        return hash.substring("#post-".length);
      }
    }
    return null;
  });

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

  const { data: postPageInfo, isLoading: isLoadingPostPage } = usePostPage(
    topic?.id || "",
    hashPostId || "",
    postsPerPage
  );

  useEffect(() => {
    if (!topic?.id || postsLoading) return;

    const hash = window.location.hash;
    if (!hash) return;

    const targetId = hash.substring(1);

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
      const postId = targetId.substring("post-".length);

      if (postPageInfo && postPageInfo.page !== currentPage) {
        console.log(
          "Navigating to page:",
          postPageInfo.page,
          "for post:",
          postId
        );
        handlePageChange(postPageInfo.page);
        return;
      }

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

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          router.back();
        }}
        className="md:hidden"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="bg-card border-b border-border">
        <div className="p-3 md:p-6">
          <div className="space-y-4">
            <div className="flex items-center flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  borderColor: topic.categories?.color ?? "",
                  color: topic.categories?.color ?? "",
                  backgroundColor: `${topic.categories?.color ?? ""}10`,
                }}
              >
                {topic.categories?.name}
              </Badge>
            </div>

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
                {/* Cast topic to AdminTopicInfoTopic for AdminControls compatibility */}
                <AdminControls
                  content={topic as AdminTopicInfoTopic}
                  contentType="topic"
                  onDelete={() => router.push("/")}
                />
              </div>
            )}

            <div className="flex items-center flex-wrap gap-3 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 md:h-4 md:w-4" />
                <span>{topic.profiles?.username || "Anonymous User"}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>
                Created {formatDistanceToNow(new Date(topic.created_at))} ago
              </span>
              {/* Use nullish coalescing for last_reply_at and reply_count */}
              {topic.last_reply_at &&
                topic.reply_count !== null &&
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
                          new Date(topic.last_reply_at!) // Add non-null assertion
                        )}{" "}
                        ago
                      </Link>
                    ) : (
                      <span>
                        Last reply{" "}
                        {formatDistanceToNow(
                          new Date(topic.last_reply_at!) // Add non-null assertion
                        )}{" "}
                        ago
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

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
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

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => setShowTopicReply(!showTopicReply)}
              >
                <MessageCircle className="h-3 w-3" />
              </Button>

              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{topic.reply_count || 0}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  const shareUrl =
                    topic.categories?.slug && topic.slug
                      ? `${window.location.origin}/category/${topic.categories.slug}/${topic.slug}`
                      : `${window.location.origin}/topic/${topic.id}`;
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
                    navigator.share(shareData).catch((error: unknown) => {
                      if (
                        error instanceof Error &&
                        error.name !== "AbortError"
                      ) {
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

      {polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollDisplay key={poll.id} poll={poll} />
          ))}
        </div>
      )}

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
                  post={reply as PostForComponent}
                  topicId={topic.id || ""}
                  depth={0}
                  onReport={handleReport}
                />
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
