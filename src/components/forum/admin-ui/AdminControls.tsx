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
import { AdminTopicInfo } from "./AdminTopicInfo";
import { useDeletePost } from "@/hooks/useDeletePost";
import { useDeleteTopic } from "@/hooks/useDeleteTopic";
import { usePinTopic } from "@/hooks/usePinTopic";

interface AdminControlsProps {
  content: any;
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

  if (user?.role !== "admin") return null;

  const handleDelete = () => {
    if (contentType === "post") {
      deletePost(content.id, {
        onSuccess: () => onDelete?.(),
      });
    } else if (contentType === "topic") {
      deleteTopic(content.id, {
        onSuccess: () => onDelete?.(),
      });
    }
  };

  const handlePinToggle = () => {
    if (contentType === "topic") {
      pinTopic({
        topicId: content.id,
        isPinned: !content.is_pinned,
      });
    }
  };

  const isDeleting = isDeletingPost || isDeletingTopic;

  return (
    <div className="flex items-center gap-1 ml-auto">
      <TooltipProvider>
        {/* Info Button - for posts and topics */}
        {(contentType === "post" || contentType === "topic") &&
          (contentType === "post" ? (
            <AdminPostInfo post={content} />
          ) : (
            <AdminTopicInfo topic={content} />
          ))}

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
                title={content.is_pinned ? "Unpin topic" : "Pin topic"}
              >
                <Pin
                  className={`h-3 w-3 ${
                    content.is_pinned ? "fill-current" : ""
                  }`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {content.is_pinned ? "Unpin topic" : "Pin topic"}
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
              disabled={isDeleting}
              title={`Delete ${contentType}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {contentType}</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to delete this {contentType}? This
                  action cannot be undone.
                </p>

                {contentType === "post" && (
                  <div className="bg-muted p-3 rounded text-sm">
                    <p>
                      <strong>Post content:</strong>{" "}
                      {content.content?.substring(0, 100)}...
                    </p>
                    <p>
                      <strong>Author:</strong>{" "}
                      {content.is_anonymous
                        ? "Anonymous"
                        : content.profiles?.username || "Unknown"}
                    </p>
                  </div>
                )}

                {contentType === "topic" && (
                  <div className="bg-muted p-3 rounded text-sm space-y-1">
                    <p>
                      <strong>Topic:</strong> {content.title}
                    </p>
                    <p>
                      <strong>Posts:</strong> {content.reply_count || 0} posts
                      in this topic
                    </p>
                    <p className="text-destructive font-medium">
                      ⚠️ Topics with posts cannot be deleted to prevent mass
                      deletion. Delete posts individually first.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Executing delete for", contentType, content.id);
                  handleDelete();
                }}
                disabled={isDeleting}
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
