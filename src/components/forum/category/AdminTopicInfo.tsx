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
import { Database } from "@/integrations/supabase/types"; // Import Database for precise types

// Define the Topic interface based on usage and your Supabase schema
// This should ideally reflect the 'topics' table row, plus any joined data.
export interface Topic {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  category_id: string;
  is_pinned: boolean | null; // Allow is_pinned to be null
  is_locked: boolean | null; // Allow is_locked to be null for consistency
  view_count: number | null; // Allow null
  reply_count: number | null; // Allow null
  last_reply_at: string | null; // Allow null
  created_at: string | null; // Allow null
  updated_at: string | null; // Allow null
  ip_address?: string | null; // CRITICAL FIX: Ensure this is optional
  slug: string | null; // Allow null
  is_hidden: boolean | null; // ADDED: is_hidden property for compatibility
  hot_score: number | null; // ADDED: hot_score property for compatibility
  last_post_id: string | null; // Explicitly 'string | null'
  // Joined data from profiles table
  profiles?: Database["public"]["Tables"]["profiles"]["Row"] | null; // Use Supabase-generated type for profiles
  // Joined data from temporary_users table (assuming it's joined as 'temporary_users')
  temporary_users?:
    | Database["public"]["Tables"]["temporary_users"]["Row"]
    | null;
  // Add other topic properties if they exist in your database and are used here
}

interface AdminTopicInfoProps {
  topic: Topic;
}

export const AdminTopicInfo: React.FC<AdminTopicInfoProps> = ({ topic }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
          title="Topic Info"
        >
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Topic Information</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div>
            <span className="font-medium">Title:</span>
            <span className="ml-2">{topic.title}</span>
          </div>
          <div>
            <span className="font-medium">Author:</span>
            <span className="ml-2">
              {topic.profiles?.username ||
                topic.temporary_users?.display_name || // FIXED: Access display_name
                "Anonymous"}
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
              {topic.created_at
                ? formatDistanceToNow(new Date(topic.created_at))
                : "N/A"}{" "}
              ago
            </span>
          </div>

          {topic.updated_at &&
            topic.created_at &&
            topic.updated_at !== topic.created_at && (
              <div>
                <span className="font-medium">Last edited:</span>
                <span className="ml-2">
                  {topic.updated_at
                    ? formatDistanceToNow(new Date(topic.updated_at))
                    : "N/A"}{" "}
                  ago
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
