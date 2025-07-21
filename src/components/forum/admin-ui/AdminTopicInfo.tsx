"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminTopicInfoProps {
  topic: any;
}

export const AdminTopicInfo: React.FC<AdminTopicInfoProps> = ({ topic }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Topic info clicked for topic:", topic.id);
          }}
        >
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Topic Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Title:</span>
            <span className="ml-2">{topic.title}</span>
          </div>

          <div>
            <span className="font-medium">Author:</span>
            <span className="ml-2">
              {topic.profiles?.username ||
                topic.temporary_users?.display_name ||
                "Anonymous User"}
            </span>
          </div>

          <div>
            <span className="font-medium">IP Address:</span>
            <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
              {topic.ip_address || "Not recorded"}
            </span>
          </div>

          <div>
            <span className="font-medium">Created:</span>
            <span className="ml-2">
              {formatDistanceToNow(new Date(topic.created_at))} ago
            </span>
          </div>

          {topic.updated_at !== topic.created_at && (
            <div>
              <span className="font-medium">Last edited:</span>
              <span className="ml-2">
                {formatDistanceToNow(new Date(topic.updated_at))} ago
              </span>
            </div>
          )}

          <div>
            <span className="font-medium">Replies:</span>
            <span className="ml-2">{topic.reply_count || 0}</span>
          </div>

          <div>
            <span className="font-medium">Views:</span>
            <span className="ml-2">{topic.view_count || 0}</span>
          </div>

          <div>
            <span className="font-medium">Pinned:</span>
            <span className="ml-2">{topic.is_pinned ? "Yes" : "No"}</span>
          </div>

          <div>
            <span className="font-medium">Locked:</span>
            <span className="ml-2">{topic.is_locked ? "Yes" : "No"}</span>
          </div>

          <div>
            <span className="font-medium">Topic ID:</span>
            <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
              {topic.id}
            </span>
          </div>

          <div>
            <span className="font-medium">Slug:</span>
            <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
              {topic.slug}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
