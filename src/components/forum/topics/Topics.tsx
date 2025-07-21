"use client";

import React, { Suspense } from "react"; // Import Suspense
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, User, Clock, Pin, Search } from "lucide-react";

import {
  useTopicsLegacy as useTopics,
  Topic as UseTopicsTopic,
} from "@/hooks/useTopicsLegacy";
import { formatDistanceToNow } from "date-fns";

export default function Topics() {
  // Explicitly type the data returned from useTopics
  const { data: topics, isLoading } = useTopics() as {
    data: UseTopicsTopic[] | undefined;
    isLoading: boolean;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Topics</h1>
          <p className="text-gray-600">Browse all forum discussions</p>
        </div>
        <Button asChild>
          <Link href="/create">Create New Topic</Link>
        </Button>
      </div>

      {/* Wrap the potentially problematic client-side components with Suspense */}
      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading topics and filters...</div>
          </Card>
        }
      >
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search topics..." className="pl-10" />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General Discussion</SelectItem>
                <SelectItem value="equipment">Equipment & Gear</SelectItem>
                <SelectItem value="coaching">Coaching & Training</SelectItem>
                <SelectItem value="tournaments">
                  Tournaments & Events
                </SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by Latest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest Activity</SelectItem>
                <SelectItem value="newest">Newest Topics</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="replies">Most Replies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Topics List */}
        <Card className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : topics && topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map(
                (
                  topic: UseTopicsTopic // Explicitly type topic
                ) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {topic.is_pinned && (
                          <Pin className="h-4 w-4 text-red-500" />
                        )}
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={
                            topic.slug && topic.categories?.slug
                              ? `/category/${topic.categories.slug}/${topic.slug}`
                              : `/topic/${topic.id}`
                          }
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {topic.title}
                        </Link>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                          <span>
                            by {topic.profiles?.username || "Unknown"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {topic.categories?.name || "General"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{topic.reply_count || 0}</span>
                        </div>
                        <span className="text-xs">replies</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{topic.view_count || 0}</span>
                        </div>
                        <span className="text-xs">views</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {/* FIX: Provide a fallback empty string for new Date() if values are null */}
                            {formatDistanceToNow(
                              new Date(
                                topic.last_reply_at || topic.created_at || ""
                              )
                            )}{" "}
                            ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No topics found
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to start a discussion!
              </p>
              <Button asChild>
                <Link href="/create">Create First Topic</Link>
              </Button>
            </div>
          )}
        </Card>
      </Suspense>
    </div>
  );
}
