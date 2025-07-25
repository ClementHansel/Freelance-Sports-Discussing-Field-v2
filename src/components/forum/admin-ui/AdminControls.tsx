"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Info, Trash2, Pin } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { AdminPostInfo } from "./AdminPostInfo";
import { AdminTopicInfo } from "./AdminTopicInfo"; // This import is crucial for its Topic type
import { useDeletePost } from "@/hooks/useDeletePost";
import { useDeleteTopic } from "@/hooks/useDeleteTopic";
import { usePinTopic } from "@/hooks/usePinTopic";

// Import the Post and Topic interfaces from their respective files
// IMPORTANT: Ensure these files EXPORT their interfaces.
import { Post } from "./AdminPostInfo"; // Post interface now allows content: string | null
import { Category } from "../category/CategoryView"; // IMPORTED: Category interface
import { Topic as AdminTopicInfoTopic } from "./AdminTopicInfo"; // Alias Topic from AdminTopicInfo
// import { PostCardTopic } from "../PostCard"; // REMOVED: This type was causing issues.

// Define a union type for the 'content' prop
// The previous error suggests that AdminControls expects AdminTopicInfoTopic for topics.
type ContentType = Post | AdminTopicInfoTopic | Category; // CHANGED: Removed PostCardTopic

interface AdminControlsProps {
  content: ContentType;
  contentType: "post" | "topic" | "category";
  onDelete?: () => void;
}

export const AdminControls: React.FC<AdminControlsProps> = ({
  content,
  contentType,
  onDelete,
}) => {
  const { user } = useAuth();
  const { mutate: deletePost, isPending: isDeletingPost } = useDeletePost();
  const { mutate: deleteTopic, isPending: isDeletingTopic } = useDeleteTopic();
  const { mutate: pinTopic, isPending: isPinningTopic } = usePinTopic();

  // Only render if user is admin
  if (user == null) {
    return null;
  }
  const authenticatedUser = user;

  if (authenticatedUser.role !== "admin") {
    return null;
  }

  const handleDelete = () => {
    if (contentType === "post") {
      deletePost((content as Post).id, {
        onSuccess: () => onDelete?.(),
      });
    } else if (contentType === "topic") {
      // Cast to AdminTopicInfoTopic as it's the most comprehensive topic type for AdminControls' internal logic
      deleteTopic((content as AdminTopicInfoTopic).id, {
        onSuccess: () => onDelete?.(),
      });
    } else if (contentType === "category") {
      console.warn("Category deletion not directly supported via this button.");
    }
  };

  const handlePinToggle = () => {
    if (contentType === "topic") {
      // Cast to AdminTopicInfoTopic
      pinTopic({
        topicId: (content as AdminTopicInfoTopic).id,
        isPinned: !(content as AdminTopicInfoTopic).is_pinned,
      });
    }
  };

  const isDeleting = isDeletingPost || isDeletingTopic;

  // Helper to determine if topic deletion should be disabled
  // Use nullish coalescing operator (??) to treat null reply_count as 0 for comparison
  const isTopicDeletionDisabled =
    contentType === "topic" &&
    ((content as AdminTopicInfoTopic).reply_count ?? 0) > 0; // Cast to AdminTopicInfoTopic

  return (
    <div className="flex items-center gap-1 ml-auto">
      <TooltipProvider>
        {/* Info Button - for posts and topics and categories */}
        {contentType === "post" ? (
          <AdminPostInfo post={content as Post} />
        ) : contentType === "topic" ? (
          // Cast to AdminTopicInfoTopic here
          <AdminTopicInfo topic={content as AdminTopicInfoTopic} />
        ) : contentType === "category" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    "Category info clicked for category:",
                    (content as Category).id
                  );
                }}
              >
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Category Info</p>
            </TooltipContent>
          </Tooltip>
        ) : null}

        {/* Pin/Unpin Button - only for topics */}
        {contentType === "topic" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handlePinToggle}
                disabled={isPinningTopic}
                title={
                  (content as AdminTopicInfoTopic).is_pinned
                    ? "Unpin topic"
                    : "Pin topic"
                }
              >
                <Pin
                  className={`h-3 w-3 ${
                    (content as AdminTopicInfoTopic).is_pinned
                      ? "fill-current"
                      : ""
                  }`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {(content as AdminTopicInfoTopic).is_pinned
                ? "Unpin topic"
                : "Pin topic"}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting || isTopicDeletionDisabled}
              title={`Delete ${contentType}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {contentType}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete this {contentType}? This action
                cannot be undone.
              </p>

              {contentType === "post" && (
                <div className="bg-muted p-3 rounded text-sm">
                  <p>
                    <strong>Post content:</strong>{" "}
                    {(content as Post).content?.substring(0, 100) || ""}...
                  </p>
                  <p>
                    <strong>Author:</strong>{" "}
                    {(content as Post).is_anonymous
                      ? "Anonymous"
                      : (content as Post).profiles?.username || "Unknown"}
                  </p>
                </div>
              )}

              {contentType === "topic" && (
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  <p>
                    <strong>Topic:</strong>{" "}
                    {(content as AdminTopicInfoTopic).title}
                  </p>
                  <p>
                    <strong>Posts:</strong>{" "}
                    {(content as AdminTopicInfoTopic).reply_count || 0} posts in
                    this topic
                  </p>
                  <p className="text-destructive font-medium">
                    ⚠️ Topics with posts cannot be deleted to prevent mass
                    deletion. Delete posts individually first.
                  </p>
                </div>
              )}
              {contentType === "category" && (
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  <p>
                    <strong>Category:</strong> {(content as Category).name}
                  </p>
                  <p className="text-destructive font-medium">
                    ⚠️ Categories cannot be deleted if they contain
                    subcategories or topics. Please ensure the category is empty
                    before attempting to delete.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Executing delete for", contentType, content.id);
                  handleDelete();
                }}
                disabled={isDeleting || isTopicDeletionDisabled}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </div>
  );
};
