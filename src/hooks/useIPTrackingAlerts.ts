"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IPTrackingAlert {
  id: string;
  content_type: "topic" | "post";
  content_id: string;
  content_title?: string | null; // Updated to allow null
  created_at: string | null; // Updated to allow null
  author_id?: string | null; // Updated to allow null
  author_username?: string | null; // Updated to allow null
  category_name?: string | null; // Updated to allow null
}

export const useIPTrackingAlerts = () => {
  return useQuery({
    queryKey: ["ip-tracking-alerts"],
    queryFn: async () => {
      // Get topics without IP addresses
      const { data: topicsWithoutIP, error: topicsError } = await supabase
        .from("topics")
        .select(
          `
          id,
          title,
          created_at,
          author_id,
          categories!inner(name)
          `
        )
        .eq("ip_address", "0.0.0.0")
        .gte("created_at", "2025-07-14")
        .order("created_at", { ascending: false })
        .limit(50);

      if (topicsError) {
        console.error("Error fetching topics without IP:", topicsError);
      }

      // Get posts without IP addresses
      const { data: postsWithoutIP, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          content,
          created_at,
          author_id,
          topic_id,
          topics!inner(title, categories!inner(name))
          `
        )
        .eq("ip_address", "0.0.0.0")
        .gte("created_at", "2025-07-14")
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsError) {
        console.error("Error fetching posts without IP:", postsError);
      }

      const alerts: IPTrackingAlert[] = [];

      // Process topics
      if (topicsWithoutIP) {
        for (const topic of topicsWithoutIP) {
          let username: string | null = "Anonymous"; // Initialize as string | null

          // Try to get username from profiles or temporary users
          if (topic.author_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", topic.author_id)
              .single(); // Use single() as it's by ID

            if (profile?.username) {
              username = profile.username;
            } else {
              // Check temporary users
              const { data: tempUser } = await supabase
                .from("temporary_users")
                .select("display_name")
                .eq("id", topic.author_id)
                .single(); // Use single() as it's by ID

              if (tempUser?.display_name) {
                username = "Guest";
              }
            }
          }

          alerts.push({
            id: topic.id,
            content_type: "topic",
            content_id: topic.id,
            content_title: topic.title, // topic.title is string, matches IPTrackingAlert
            created_at: topic.created_at, // Now matches string | null
            author_id: topic.author_id, // Now matches string | null | undefined
            author_username: username, // Now matches string | null | undefined
            category_name: (topic.categories as { name: string | null })?.name, // Cast to ensure name is string | null
          });
        }
      }

      // Process posts
      if (postsWithoutIP) {
        for (const post of postsWithoutIP) {
          let username: string | null = "Anonymous"; // Initialize as string | null

          // Try to get username from profiles or temporary users
          if (post.author_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", post.author_id)
              .single(); // Use single() as it's by ID

            if (profile?.username) {
              username = profile.username;
            } else {
              // Check temporary users
              const { data: tempUser } = await supabase
                .from("temporary_users")
                .select("display_name")
                .eq("id", post.author_id)
                .single(); // Use single() as it's by ID

              if (tempUser?.display_name) {
                username = "Guest";
              }
            }
          }

          alerts.push({
            id: `post-${post.id}`,
            content_type: "post",
            content_id: post.id,
            content_title: (post.topics as { title: string | null })?.title, // Cast to ensure title is string | null
            created_at: post.created_at, // Now matches string | null
            author_id: post.author_id, // Now matches string | null | undefined
            author_username: username, // Now matches string | null | undefined
            category_name: (
              post.topics as { categories: { name: string | null } }
            )?.categories?.name, // Cast and optional chaining
          });
        }
      }

      // Sort by creation date
      alerts.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime() // Handle potential null for Date constructor
      );

      return alerts;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
