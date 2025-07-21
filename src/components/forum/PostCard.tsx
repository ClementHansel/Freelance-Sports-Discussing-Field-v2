"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Pin, Lock, Flag } from "lucide-react"; // Removed ArrowUp, ArrowDown
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

import { htmlToText } from "@/lib/utils/htmlToText"; // Corrected import path
// Removed: import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Removed as Avatar section is removed
import { Card } from "@/components/ui/card";
import { HTMLRenderer } from "@/components/ui/html-renderer";
// Removed: import { useReportContent } from '@/hooks/useReportContent';
// Removed: import { useVote } from '@/hooks/useVote';
import { InlineReplyForm } from "./InlineReplyForm";
import { toast } from "@/hooks/use-toast";
import { generateCategoryUrl } from "@/lib/utils/urlHelpers";
import { AdminTempUserInfo } from "../dashboard/admin/AdminTempUserInfo";
import { AdminControls } from "./admin-ui/AdminControls";

// Define PostCardTopic based on how PostCard.tsx actually uses the 'topic' object
// and aligning with common Supabase nullability patterns.
interface PostCardTopic {
  id: string;
  created_at: string | null;
  title: string;
  content: string | null;
  view_count: number | null; // Renamed from 'views' to 'view_count' for consistency, allows null
  reply_count: number | null;
  last_reply_at: string | null;
  author_id: string | null;
  category_id: string; // Assuming category_id is always present
  is_locked: boolean | null;
  is_pinned: boolean | null;
  is_hidden: boolean | null;
  slug: string | null; // Allows null
  hot_score: number | null;
  last_post_id: string | null;

  // Denormalized properties directly on the topic object (from HotTopic's typical structure)
  parent_category_id: string | null;
  parent_category_slug: string | null;
  username: string | null; // Denormalized author username
  avatar_url: string | null; // Denormalized author avatar URL
  category_name: string | null;
  category_color: string | null;
  category_slug: string | null;
  updated_at: string | null; // Allows null
  moderation_status?: string | null; // Optional, allows null
  // Removed 'profiles' as it's not directly on HotTopic and username/avatar_url are denormalized
}

interface PostCardProps {
  topic: PostCardTopic; // Using the refined PostCardTopic interface
  onReport?: (topicId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = React.memo(
  ({ topic, onReport }) => {
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const [showReplyForm, setShowReplyForm] = React.useState(false); // State for inline reply form

    const handleShare = () => {
      // Construct the URL based on whether slug is available
      const shareUrl =
        topic.category_slug && topic.slug
          ? `${window.location.origin}/category/${topic.category_slug}/${topic.slug}`
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
        navigator
          .share(shareData)
          .then(() => {
            toast({
              title: "Shared successfully!",
              description: "Topic shared using your device's share menu.",
            });
          })
          .catch((error) => {
            if (error.name !== "AbortError") {
              // Fallback to clipboard if share fails or is aborted
              const textArea = document.createElement("textarea");
              textArea.value = shareUrl;
              document.body.appendChild(textArea);
              textArea.select();
              try {
                document.execCommand("copy");
                toast({
                  title: "Link copied!",
                  description: "Topic link has been copied to clipboard.",
                });
              } catch (err) {
                toast({
                  title: "Share failed",
                  description: "Could not copy link to clipboard.",
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
            description: "Topic link has been copied to clipboard.",
          });
        } catch (err) {
          toast({
            title: "Share failed",
            description: "Could not copy link to clipboard.",
            variant: "destructive",
          });
        } finally {
          document.body.removeChild(textArea);
        }
      }
    };

    // Determine the author's username (avatar is not displayed in original structure)
    const authorUsername = topic.username || "Guest"; // Removed topic.profiles?.username

    // Generate the category URL for the clickable badge
    const categoryUrl = generateCategoryUrl({
      slug: topic.category_slug ?? "", // Use nullish coalescing to ensure string
      parent_category_id: topic.parent_category_id ?? undefined, // Use nullish coalescing to ensure string | undefined
      parent_category: topic.parent_category_slug
        ? {
            slug: topic.parent_category_slug,
          }
        : undefined,
    });

    return (
      <div className="bg-card border-b border-border hover:bg-muted/50 transition-colors">
        <div className="p-3 md:p-4">
          {/* Mobile-first layout */}
          <div className="flex space-x-3">
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Category and meta info */}
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {topic.category_name && ( // Only render if category_name exists
                  <Link
                    href={categoryUrl}
                    className="inline-block hover:opacity-80 transition-opacity"
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 cursor-pointer"
                      style={{
                        borderColor: topic.category_color ?? "",
                        color: topic.category_color ?? "",
                        backgroundColor: `${topic.category_color ?? ""}10`,
                      }}
                    >
                      {topic.category_name}
                    </Badge>
                  </Link>
                )}
                {topic.is_pinned && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Pin className="h-3 w-3" />
                    <span className="text-xs font-medium">Pinned</span>
                  </div>
                )}
                {topic.is_locked && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <Lock className="h-3 w-3" />
                    <span className="text-xs font-medium">Locked</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={
                    topic.category_slug && topic.slug
                      ? `/category/${topic.category_slug}/${topic.slug}`
                      : `/topic/${topic.id}`
                  }
                  className="block group flex-1"
                >
                  <h3 className="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {topic.title}
                  </h3>
                </Link>
                <AdminControls content={topic} contentType="topic" />
              </div>

              {/* Content preview - only on desktop */}
              {!isMobile && topic.content && (
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-3">
                  {htmlToText(topic.content)}
                </p>
              )}

              {/* Admin tracking info for temporary users */}
              {user?.role === "admin" && !topic.username && (
                <AdminTempUserInfo
                  userId={topic.author_id ?? ""}
                  className="mb-3"
                />
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{authorUsername}</span>
                  <span>
                    Created{" "}
                    {formatDistanceToNow(new Date(topic.created_at ?? ""))} ago
                  </span>
                  {topic.last_reply_at && (topic.reply_count ?? 0) > 0 && (
                    <>
                      <span>•</span>
                      {topic.last_post_id ? (
                        <Link
                          // Fixed: Ensure the entire path including hash is within the template literal
                          href={
                            topic.category_slug && topic.slug
                              ? `/category/${topic.category_slug}/${topic.slug}#post-${topic.last_post_id}`
                              : `/topic/${topic.id}#post-${topic.last_post_id}`
                          }
                          className="hover:text-primary transition-colors"
                        >
                          Last reply{" "}
                          {formatDistanceToNow(
                            new Date(topic.last_reply_at ?? "")
                          )}{" "}
                          ago
                        </Link>
                      ) : (
                        <span>
                          Last reply{" "}
                          {formatDistanceToNow(
                            new Date(topic.last_reply_at ?? "")
                          )}{" "}
                          ago
                        </span>
                      )}
                    </>
                  )}
                  <Link
                    href={
                      topic.category_slug && topic.slug
                        ? `/category/${topic.category_slug}/${topic.slug}`
                        : `/topic/${topic.id}`
                    }
                    className="flex items-center space-x-1 hover:text-primary transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>{topic.reply_count ?? 0}</span>
                  </Link>
                </div>

                {/* Report button - mobile friendly */}
                {onReport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onReport(topic.id);
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-orange-500"
                    title="Report"
                  >
                    <Flag className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
