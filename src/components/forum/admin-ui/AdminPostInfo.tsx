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

// Define the Post interface based on usage and your Supabase schema
// This should ideally reflect the 'posts' table row, plus any joined data.
export interface Post {
  id: string;
  content: string | null; // Allow content to be null
  author_id: string | null;
  topic_id: string;
  created_at: string | null; // Allow created_at to be null
  updated_at: string | null; // Allow updated_at to be null
  ip_address: string | null;
  is_anonymous: boolean | null; // Allow null, as per common DB schemas
  // Assuming 'profiles' is a joined table from 'posts'
  profiles?: Database["public"]["Tables"]["profiles"]["Row"] | null; // Use Supabase-generated type for profiles
  // Add other post properties if they exist in your database and are used here
}

export interface AdminPostInfoProps {
  post: Post;
}

export const AdminPostInfo: React.FC<AdminPostInfoProps> = ({ post }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Post info clicked for post:", post.id);
          }}
        >
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Post Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Author:</span>
            <span className="ml-2">
              {post.profiles?.username || "Anonymous"}
            </span>
          </div>

          <div>
            <span className="font-medium">IP Address:</span>
            <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
              {post.ip_address || "Not recorded"}
            </span>
          </div>

          <div>
            <span className="font-medium">Created:</span>
            <span className="ml-2">
              {post.created_at
                ? formatDistanceToNow(new Date(post.created_at))
                : "N/A"}{" "}
              ago
            </span>
          </div>

          {post.updated_at &&
            post.created_at &&
            post.updated_at !== post.created_at && (
              <div>
                <span className="font-medium">Last edited:</span>
                <span className="ml-2">
                  {post.updated_at
                    ? formatDistanceToNow(new Date(post.updated_at))
                    : "N/A"}{" "}
                  ago
                </span>
              </div>
            )}

          <div>
            <span className="font-medium">Post ID:</span>
            <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
              {post.id}
            </span>
          </div>

          <div>
            <span className="font-medium">Anonymous:</span>
            <span className="ml-2">{post.is_anonymous ? "Yes" : "No"}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
