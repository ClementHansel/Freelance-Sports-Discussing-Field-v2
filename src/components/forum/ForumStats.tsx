"use client";

import React from "react";
import { Users, MessageSquare, TrendingUp } from "lucide-react";
import { useForumStats } from "@/hooks/useForumStats";

export default function ForumStats() {
  const { data: stats, isLoading } = useForumStats();

  if (isLoading) {
    return (
      <div className="bg-card border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-t mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Users className="h-6 w-6 text-blue-500" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-2xl font-bold">{stats?.total_members || 0}</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <MessageSquare className="h-6 w-6 text-green-500" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Posts</p>
              <p className="text-2xl font-bold">{stats?.total_posts || 0}</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Topics</p>
              <p className="text-2xl font-bold">{stats?.total_topics || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
