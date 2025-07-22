"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useTempUser } from "@/hooks/useTempUser";
import { useEnhancedSpamDetection } from "@/hooks/useEnhancedSpamDetection";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { htmlToText } from "@/lib/utils/htmlToText";
import { Database } from "@/integrations/supabase/types"; // Import Database for precise types

// Define a minimal Post interface for what's used in this component
interface PostForReplyForm {
  id: string;
  content: string | null; // Content can be null in DB
  is_anonymous: boolean | null; // Can be null in DB
  created_at: string | null; // Can be null in DB
  profiles?: {
    // Joined profiles data
    username: string | null; // Username can be null
  } | null; // Profiles object itself can be null if not joined or no author
}

// Define a minimal Topic interface for what's used in this component
interface TopicForReplyForm {
  id: string;
  title: string;
  created_at: string | null; // Can be null in DB
  // Add other topic properties if needed, but only those used by this component
}

// Union type for the parentPost prop
type ParentPostType = PostForReplyForm | TopicForReplyForm;

interface InlineReplyFormProps {
  topicId: string;
  parentPostId: string | null;
  parentPost?: ParentPostType; // Typed parentPost
  onCancel: () => void;
  onSuccess: () => void;
  isTopicReply?: boolean;
}

export const InlineReplyForm: React.FC<InlineReplyFormProps> = ({
  topicId,
  parentPostId,
  parentPost,
  onCancel,
  onSuccess,
  isTopicReply = false,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [contentErrors, setContentErrors] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // This ref might be for a different internal component, keep as is for now
  const createPostMutation = useCreatePost();
  const tempUser = useTempUser();
  const { analyzeContent } = useEnhancedSpamDetection();

  useEffect(() => {
    // Auto-focus when form appears
    // Note: WysiwygEditor likely manages its own focus internally.
    // If textareaRef is specifically for a raw textarea, this might be relevant.
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Stable callback to prevent WysiwygEditor re-renders
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply",
        variant: "destructive",
      });
      return;
    }

    // Basic validation for anonymous users (rate limits removed)
    if (!user) {
      const validation = tempUser.validateContent(content);
      if (!validation.isValid) {
        setContentErrors(validation.errors);
        toast({
          title: "Content not allowed",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }
      setContentErrors([]);
    }

    try {
      const newPost = await createPostMutation.mutateAsync({
        content,
        topic_id: topicId,
        parent_post_id: parentPostId,
      });

      // Record post and refresh rate limit for anonymous users first
      if (!user) {
        await tempUser.recordPost();
        await tempUser.refreshRateLimit();
      }

      toast({
        title: "Success",
        description: "Reply posted successfully!",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to post reply. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={`w-full min-w-0 ${
        isTopicReply
          ? "bg-primary/5 rounded-md p-4"
          : "mt-3 bg-muted/30 rounded-md p-3"
      }`}
    >
      {/* Enhanced reply context with quote preview */}
      {parentPost && (
        <div className="mb-2">
          <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r p-2 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Replying to</span>
              <span className="font-medium text-slate-700">
                {
                  isTopicReply
                    ? "Original Post"
                    : (parentPost as PostForReplyForm).is_anonymous // Cast for is_anonymous
                    ? "Guest"
                    : (parentPost as PostForReplyForm).profiles?.username ||
                      "Unknown" // Cast for profiles
                }
              </span>
              {!isTopicReply && parentPost.created_at && (
                <>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(parentPost.created_at))} ago
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-500 italic bg-white/50 rounded p-1">
              {(() => {
                const text = isTopicReply
                  ? (parentPost as TopicForReplyForm).title // Cast for title
                  : htmlToText((parentPost as PostForReplyForm).content || ""); // Cast for content, provide fallback for htmlToText
                return `"${
                  text.length > 150 ? `${text.substring(0, 150)}...` : text
                }"`;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Anonymous posting notice */}
      {!user && tempUser.tempUser && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="text-sm text-amber-800">
            <div className="font-medium">Posting as: Guest</div>
            {!tempUser.canPost && (
              <div className="text-xs mt-1">Daily rate limit reached</div>
            )}
            <div className="text-xs mt-1 text-amber-700">
              Posts appear immediately • No images or links allowed
            </div>
            <div className="text-xs mt-2 text-amber-600">
              <Link href="/register" className="underline hover:no-underline">
                Create account for unlimited posting + images/links
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <WysiwygEditor
          value={content}
          onChange={handleContentChange}
          placeholder={
            user
              ? "Write your reply..."
              : "Write your reply as an anonymous user (no images or links allowed)..."
          }
          height={120}
          allowImages={!!user}
          hideToolbar={!user}
        />

        {contentErrors.length > 0 && (
          <div className="text-sm text-destructive">
            <ul className="list-disc list-inside">
              {contentErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !content.trim() ||
              createPostMutation.isPending ||
              (!user && !tempUser.canPost)
            }
            size="sm"
            className="h-8 px-3 text-xs"
          >
            {createPostMutation.isPending ? "Posting..." : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
};
