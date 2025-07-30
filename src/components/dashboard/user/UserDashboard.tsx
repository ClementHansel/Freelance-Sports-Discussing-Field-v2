// src/app/(dashboard)/user/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  PenSquare,
  Star,
  Bookmark,
  Activity,
  Plus,
  ArrowRight,
  CalendarDays,
  Flame, // For hot topics/activity
  Eye, // For views
  FlaskConical, // Icon to denote conceptual/experimental features
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Assuming useAuth provides user info
import { format } from "date-fns"; // For date formatting
import { cn } from "@/lib/utils"; // For conditional class names

// ====================================================================================
// CONCEPTUAL DATA (REPLACE WITH REAL HOOKS/API CALLS)
//
// These are placeholders for data that would typically come from your Supabase
// backend via custom hooks. You'll need to implement the actual data fetching
// using your Supabase client and potentially new RPC functions or table queries.
// ====================================================================================

// TODO: Replace with actual data from a `useUserStats` hook
const conceptualUserStats = {
  totalTopics: 15,
  totalPosts: 120,
  reputation: 850,
  joinDate: "2023-01-15T10:00:00Z", // ISO string
};

// TODO: Replace with actual data from a `useRecentUserActivity` hook
const conceptualRecentActivity = [
  {
    id: "act1",
    type: "post",
    title: "Re: Best drills for defensemen?",
    link: "/category/training-drills/best-drills-defensemen#post-123",
    timestamp: "2024-07-29T14:30:00Z",
    views: 50,
    replies: 5,
  },
  {
    id: "act2",
    type: "topic",
    title: "Tips for new goalies joining a travel team",
    link: "/category/goalie-advice/tips-new-goalies-travel-team",
    timestamp: "2024-07-28T09:15:00Z",
    views: 200,
    replies: 10,
  },
  {
    id: "act3",
    type: "post",
    title: "Re: How to improve puck handling quickly",
    link: "/category/skill-development/improve-puck-handling#post-456",
    timestamp: "2024-07-27T18:00:00Z",
    views: 75,
    replies: 8,
  },
  {
    id: "act4",
    type: "topic",
    title: "Looking for advice on stick flex for peewee players",
    link: "/category/equipment-reviews/advice-stick-flex-peewee",
    timestamp: "2024-07-26T11:45:00Z",
    views: 150,
    replies: 7,
  },
];

// TODO: Replace with actual data from a `useBookmarkedCategories` hook
const conceptualBookmarkedCategories = [
  { id: "cat1", name: "Training & Drills", slug: "training-drills" },
  { id: "cat2", name: "Equipment Reviews", slug: "equipment-reviews" },
  { id: "cat3", name: "Team Management", slug: "team-management" },
  { id: "cat4", name: "Goalie Advice", slug: "goalie-advice" },
];

export default function UserDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          Please sign in to view your dashboard.
        </p>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
        <CardTitle className="text-3xl font-bold mb-2">
          Welcome, {user.username || "Hockey Fan"}!
        </CardTitle>
        <p className="text-blue-100">
          Your personalized hub for all things Minor Hockey Talks.
        </p>
        <p className="text-blue-200 text-sm mt-2 flex items-center gap-1">
          <CalendarDays className="h-4 w-4" /> Member since:{" "}
          {format(new Date(conceptualUserStats.joinDate), "PPP")}
        </p>
      </Card>

      {/* Quick Stats - Marked as Conceptual Data */}
      <Card
        className={cn(
          "p-4 border border-dashed border-gray-300 bg-gray-50 opacity-70",
          "relative"
        )}
      >
        <Badge
          variant="outline"
          className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 flex items-center gap-1"
        >
          <FlaskConical className="h-3 w-3" /> Conceptual Data
        </Badge>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {conceptualUserStats.totalTopics}
              </div>
              <p className="text-sm text-gray-500">Topics Created</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <PenSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {conceptualUserStats.totalPosts}
              </div>
              <p className="text-sm text-gray-500">Total Posts</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {conceptualUserStats.reputation}
              </div>
              <p className="text-sm text-gray-500">Reputation</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4 italic">
          This section displays conceptual user statistics. Actual data will be
          fetched from the backend.
        </p>
      </Card>

      {/* Recent Activity & Bookmarked Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - Marked as Conceptual Data */}
        <Card
          className={cn(
            "border border-dashed border-gray-300 bg-gray-50 opacity-70",
            "relative"
          )}
        >
          <Badge
            variant="outline"
            className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 flex items-center gap-1"
          >
            <FlaskConical className="h-3 w-3" /> Conceptual Data
          </Badge>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" /> Recent Activity
            </CardTitle>
            <Button variant="link" asChild>
              <Link href="/user/activity">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {conceptualRecentActivity.length > 0 ? (
              conceptualRecentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Badge
                    variant={
                      activity.type === "topic" ? "default" : "secondary"
                    }
                    className="flex-shrink-0 mb-1 sm:mb-0"
                  >
                    {activity.type === "topic" ? "Topic" : "Post"}
                  </Badge>
                  <div className="flex-1">
                    <Link
                      href={activity.link}
                      className="font-medium text-blue-600 hover:underline text-sm sm:text-base"
                    >
                      {activity.title}
                    </Link>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-2">
                      <span>
                        {format(new Date(activity.timestamp), "MMM dd, yyyy")}
                      </span>
                      {activity.views !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {activity.views}
                        </span>
                      )}
                      {activity.replies !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />{" "}
                          {activity.replies}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                No recent activity found. Start a new topic or post!
              </p>
            )}
          </CardContent>
          <p className="text-xs text-gray-600 px-6 pb-4 italic">
            This section displays conceptual recent user activity. Actual data
            will be fetched from the backend.
          </p>
        </Card>

        {/* Bookmarked Categories - Marked as Conceptual Data */}
        <Card
          className={cn(
            "border border-dashed border-gray-300 bg-gray-50 opacity-70",
            "relative"
          )}
        >
          <Badge
            variant="outline"
            className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 flex items-center gap-1"
          >
            <FlaskConical className="h-3 w-3" /> Conceptual Data
          </Badge>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-gray-600" /> Bookmarked
              Categories
            </CardTitle>
            {conceptualBookmarkedCategories.length > 0 && (
              <Button variant="link" asChild>
                <Link href="/user/bookmarks">
                  Manage Bookmarks <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {conceptualBookmarkedCategories.length > 0 ? (
              conceptualBookmarkedCategories.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <Badge
                    variant="outline"
                    className="px-3 py-1 text-base cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                No categories bookmarked yet. Explore the forum to find
                categories you like!
              </p>
            )}
          </CardContent>
          <p className="text-xs text-gray-600 px-6 pb-4 italic">
            This section displays conceptual bookmarked categories. Actual data
            will be fetched from the backend.
          </p>
        </Card>
      </div>

      {/* Quick Actions - Not Conceptual (these links are real) */}
      <Card className="p-6">
        <CardTitle className="text-lg font-semibold mb-4">
          Quick Actions
        </CardTitle>
        <div className="flex flex-wrap gap-4">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/create-topic">
              <Plus className="mr-2 h-4 w-4" /> Create New Topic
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/user/my-topics">
              <MessageSquare className="mr-2 h-4 w-4" /> View My Topics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/user/my-posts">
              <PenSquare className="mr-2 h-4 w-4" /> View My Posts
            </Link>
          </Button>
        </div>
      </Card>

      {/* CONCEPTUAL: My Top Topics - Marked as Conceptual Data */}
      <Card
        className={cn(
          "border border-dashed border-gray-300 bg-gray-50 opacity-70",
          "relative"
        )}
      >
        <Badge
          variant="outline"
          className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 flex items-center gap-1"
        >
          <FlaskConical className="h-3 w-3" /> Conceptual Data
        </Badge>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" /> My Top Topics
          </CardTitle>
          <Button variant="link" asChild>
            <Link href="/user/my-topics?sort=popular">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* TODO: This would be fetched by a hook like `useUserTopTopics(user?.id, 'most_views', 3)` */}
          {conceptualRecentActivity.slice(0, 3).map(
            (
              topic // Reusing recent activity for concept
            ) => (
              <div
                key={`top-${topic.id}`}
                className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <Link
                    href={topic.link}
                    className="font-medium text-blue-600 hover:underline text-sm sm:text-base"
                  >
                    {topic.title}
                  </Link>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-2">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {topic.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {topic.replies}{" "}
                      replies
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
          {conceptualRecentActivity.length === 0 && (
            <p className="text-gray-500 text-sm">
              No top topics to display yet.
            </p>
          )}
        </CardContent>
        <p className="text-xs text-gray-600 px-6 pb-4 italic">
          This section displays conceptual top topics based on user activity.
          Actual data will be fetched from the backend.
        </p>
      </Card>
    </div>
  );
}
