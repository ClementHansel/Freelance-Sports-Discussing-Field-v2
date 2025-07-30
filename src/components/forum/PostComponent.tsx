// src/components/forum/PostComponent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { HTMLRenderer } from "@/components/ui/html-renderer";
import {
  Reply,
  ArrowUp,
  ArrowDown,
  Flag,
  MessageCircle,
  Share,
  Edit,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

import { InlineReplyForm } from "./InlineReplyForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEditPost } from "@/hooks/useEditPost";
import { useDeletePost } from "@/hooks/useDeletePost";
import { AdminPostInfo } from "./category/AdminPostInfo";

import { AdminTempUserInfo } from "@/components/dashboard/admin/AdminTempUserInfo";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Import canonical Post and ModerationStatus types
import { Post } from "@/hooks/usePosts"; // This is the single source of truth for Post type
import { ModerationStatus } from "@/types/forum"; // Import shared ModerationStatus type
import { AdminControls } from "./category/AdminControls";

// REMOVED: Local Post and ParentPostData interfaces.
// The Post interface from "@/hooks/usePosts" is now the canonical one.
// The parent_post property within the canonical Post type is already defined as Post.
// The ModerationStatus type is now imported from "@/types/forum".

// Define the user object from useAuth
interface AuthUser {
  id: string;
  role: "admin" | "moderator" | "user";
}

// Ensure this Post interface is EXPORTED if TopicView.tsx is importing it directly from here
// However, the best practice is for TopicView.tsx to import Post from '@/hooks/usePosts' directly
// since that's the canonical source. If TopicView.tsx is trying to get it via PostComponent,
// this export is necessary.
// For now, let's assume PostComponent is the re-exporter for Post for TopicView's sake.
export type { Post } from "@/hooks/usePosts"; // Re-export Post from its canonical source

interface PostComponentProps {
  post: Post; // Now using the imported canonical Post type
  topicId: string;
  depth?: number;
  onReport: (
    contentType: "post" | "topic",
    postId?: string,
    topicId?: string
  ) => void;
}

export const PostComponent: React.FC<PostComponentProps> = React.memo(
  ({ post, topicId, depth = 0, onReport }) => {
    const { user } = useAuth();
    const { mutate: editPost, isPending: isEditingPost } = useEditPost();
    const { mutate: deletePost, isPending: isDeletingPost } = useDeletePost();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    // Initialize useState directly with post.moderation_status
    // It is now guaranteed to be ModerationStatus | null due to usePosts.ts changes
    const [moderationStatus, setModerationStatus] =
      useState<ModerationStatus | null>(post.moderation_status);
    const [isVisible, setIsVisible] = useState(
      (post.moderation_status || "approved") === "approved"
    );
    const { toast } = useToast();

    useEffect(() => {
      const channel = supabase
        .channel(`post-moderation-${post.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "posts",
            filter: `id=eq.${post.id}`,
          },
          (payload) => {
            // Cast payload.new to the canonical Post type
            const newPostData = payload.new as Post;
            if (newPostData && newPostData.moderation_status) {
              // newPostData.moderation_status is already ModerationStatus | null due to usePosts.ts change
              setModerationStatus(newPostData.moderation_status);
              setIsVisible(newPostData.moderation_status === "approved");

              if (newPostData.moderation_status === "pending") {
                toast({
                  title: "Content flagged",
                  description:
                    "This post has been flagged and is now under review.",
                  variant: "default",
                });
              }
            } else if (newPostData && newPostData.moderation_status === null) {
              // Handle case where moderation_status might be explicitly set to null
              setModerationStatus(null);
              setIsVisible(true); // If null, assume approved for display
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [post.id, toast]);

    // This logic is correct: It checks the POST's status and the USER's role.
    if (moderationStatus !== "approved" && (!user || user.role !== "admin")) {
      return (
        <div className="relative border-b border-border/50 pb-2 mb-2 w-full">
          <div className="bg-muted/50 p-3 md:p-4 rounded-md w-full text-center">
            <div className="text-muted-foreground text-sm">
              {moderationStatus === "pending"
                ? "This post is under review and temporarily unavailable."
                : "This post has been removed by moderators."}
            </div>
          </div>
        </div>
      );
    }

    const handleReplySuccess = () => {
      setShowReplyForm(false);
    };

    const handleEditSave = () => {
      if (editContent.trim() !== post.content) {
        editPost({ postId: post.id, content: editContent.trim() });
      }
      setIsEditing(false);
    };

    const handleEditCancel = () => {
      setEditContent(post.content);
      setIsEditing(false);
    };

    const canEdit =
      user &&
      (user.id === post.author_id ||
        user.role === "admin" ||
        user.role === "moderator");

    const handleShare = async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
      const shareData = {
        title: "Forum Post",
        text: `Check out this post: ${post.content.slice(0, 100)}${
          post.content.length > 100 ? "..." : ""
        }`,
        url: shareUrl,
      };

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        try {
          await navigator.share(shareData);
        } catch (error: unknown) {
          if (error instanceof Error && error.name !== "AbortError") {
            handleClipboardShare(shareUrl);
          }
        }
      } else {
        handleClipboardShare(shareUrl);
      }
    };

    const handleClipboardShare = async (url: string) => {
      try {
        // Using document.execCommand('copy') for better iframe compatibility
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        toast({
          title: "Link copied!",
          description: "Post link has been copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      }
    };

    return (
      <div
        id={`post-${post.id}`}
        className="relative border-b border-border/50 pb-2 mb-2 w-full"
      >
        <div className="bg-card p-3 md:p-4 rounded-md w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-medium text-foreground text-sm">
                {post.profiles?.username || "Guest"}
              </span>
              <span className="text-xs text-muted-foreground">
                {post.created_at
                  ? formatDistanceToNow(new Date(post.created_at))
                  : "N/A"}{" "}
                ago
              </span>
            </div>
          </div>

          {user?.role === "admin" && !post.profiles?.username && (
            <AdminTempUserInfo userId={post.author_id || ""} className="mb-3" />
          )}

          <div className="mb-4">
            {isEditing ? (
              <div className="space-y-3">
                <WysiwygEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Edit your post..."
                  height={150}
                  allowImages={!!user}
                  hideToolbar={!user}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleEditSave}
                    disabled={isEditingPost || !editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditCancel}
                    disabled={isEditingPost}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {post.parent_post_id && post.parent_post && (
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      <span>Replying to</span>
                      <span className="font-medium text-foreground">
                        {post.parent_post.profiles?.username || "Guest"}
                      </span>
                      <span>•</span>
                      <span>
                        {post.parent_post.created_at
                          ? formatDistanceToNow(
                              new Date(post.parent_post.created_at)
                            )
                          : "N/A"}{" "}
                        ago
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground bg-background/50 rounded p-2 border-l-2 border-muted">
                      {post.parent_post.moderation_status === "approved" ? (
                        <HTMLRenderer
                          content={post.parent_post.content || ""}
                        />
                      ) : (
                        <div className="italic text-muted-foreground">
                          [This content is under review and temporarily
                          unavailable]
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-foreground text-base font-normal bg-background p-3 rounded border-l-4 border-primary">
                  <HTMLRenderer content={post.content} />
                </div>

                {post.updated_at &&
                  post.created_at &&
                  new Date(post.updated_at).getTime() !==
                    new Date(post.created_at).getTime() && (
                    <p className="text-xs text-muted-foreground mt-1">
                      (edited {formatDistanceToNow(new Date(post.updated_at))}{" "}
                      ago)
                    </p>
                  )}
              </div>
            )}
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reply</p>
                </TooltipContent>
              </Tooltip>

              {canEdit && !isEditing && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={handleShare}
                  >
                    <Share className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>

              {user?.role === "admin" && (
                <AdminControls content={post} contentType="post" />
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onReport("post", post.id)}
                  >
                    <Flag className="h-3 w-3 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Report</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {showReplyForm && (
            <InlineReplyForm
              topicId={topicId}
              parentPostId={post.id}
              parentPost={post}
              onCancel={() => setShowReplyForm(false)}
              onSuccess={handleReplySuccess}
            />
          )}
        </div>
      </div>
    );
  }
);
