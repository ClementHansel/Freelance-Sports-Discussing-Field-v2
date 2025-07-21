"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminActivity {
  id: string;
  user: string;
  action: string;
  content: string;
  time: string | null; // Allow null for time
  type: "topic" | "post";
  ip_address?: string | null; // Allow null for ip_address
  topic_info?: {
    title: string | null; // Allow null for title
    slug: string | null; // Allow null for slug
    category_slug: string | null; // Allow null for category_slug
  } | null; // Allow null for topic_info object
}

export const useAdminActivity = () => {
  return useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      // Get recent topics with category information
      const { data: recentTopics, error: topicsError } = await supabase
        .from("topics")
        .select(
          `
          id,
          title,
          slug,
          created_at,
          author_id,
          categories (
            slug
          )
          `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (topicsError) throw topicsError;

      // Get recent posts with topic and category information
      const { data: recentPosts, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          created_at,
          author_id,
          topic_id,
          ip_address,
          topics (
            id,
            title,
            slug,
            categories (
              slug
            )
          )
          `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (postsError) throw postsError;

      // Get unique author IDs, filtering out nulls
      const authorIds = [
        ...(recentTopics?.map((topic) => topic.author_id) || []),
        ...(recentPosts?.map((post) => post.author_id) || []),
      ].filter((id): id is string => id !== null); // Filter out nulls and assert type

      // Fetch user data from both profiles and temporary_users
      const [profilesData, temporaryUsersData] = await Promise.all([
        authorIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, username")
              .in("id", authorIds)
              .then(({ data }) => data || [])
          : Promise.resolve([]),

        authorIds.length > 0
          ? supabase
              .from("temporary_users")
              .select("id, display_name")
              .in("id", authorIds)
              .then(({ data }) => data || [])
          : Promise.resolve([]),
      ]);

      // Create a map for quick user lookup
      const userMap = new Map<string, string>(); // Explicitly type Map
      profilesData.forEach((profile) => {
        userMap.set(profile.id, profile.username);
      });
      temporaryUsersData.forEach((tempUser) => {
        userMap.set(tempUser.id, "Guest");
      });

      // Combine and format activities
      const activities: AdminActivity[] = [];

      // Add topics
      recentTopics?.forEach((topic) => {
        const username = topic.author_id
          ? userMap.get(topic.author_id) || "Anonymous User"
          : "Anonymous User";
        activities.push({
          id: topic.id,
          user: username,
          action: "Created topic",
          content: topic.title,
          time: topic.created_at, // This can be string | null
          type: "topic",
          ip_address: null, // Explicitly set to null if not tracked for topics
          topic_info: {
            title: topic.title,
            slug: topic.slug,
            category_slug:
              (topic.categories as { slug: string | null })?.slug || null, // Handle potential null
          },
        });
      });

      // Add posts
      recentPosts?.forEach((post) => {
        const username = post.author_id
          ? userMap.get(post.author_id) || "Anonymous User"
          : "Anonymous User";
        const topicTitle = post.topics?.title || "Unknown Topic";
        activities.push({
          id: post.id,
          user: username,
          action: "Replied to",
          content: topicTitle,
          time: post.created_at, // This can be string | null
          type: "post",
          ip_address:
            typeof post.ip_address === "string" ? post.ip_address : null, // Convert undefined to null
          topic_info: post.topics
            ? {
                title: post.topics.title ?? null, // Convert undefined to null
                slug: post.topics.slug ?? null, // Convert undefined to null
                category_slug:
                  (post.topics.categories as { slug: string | null })?.slug ??
                  null, // Handle potential null and convert undefined to null
              }
            : null, // Explicitly set to null if no topic info
        });
      });

      // Sort by time and take the 10 most recent
      return activities
        .sort((a, b) => {
          const timeA = a.time ? new Date(a.time).getTime() : 0; // Handle null time
          const timeB = b.time ? new Date(b.time).getTime() : 0; // Handle null time
          return timeB - timeA;
        })
        .slice(0, 10);
    },
  });
};
