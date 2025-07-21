"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  title: string;
  content: string | null; // Allow null
  type: "topic" | "post" | "category";
  author_username: string;
  category_name: string;
  category_color: string;
  category_slug?: string | null; // Allow null
  slug?: string | null; // Allow null
  reply_count: number;
  view_count: number;
  created_at: string | null; // Allow null
}

export type SearchFilter = "all" | "categories" | "topics" | "posts";

export const useSearch = (query: string, filter: SearchFilter = "all") => {
  return useQuery({
    queryKey: ["search", query, filter],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = query.trim();
      const searchWords = searchTerm
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const results: SearchResult[] = [];

      // Search in topics (if filter allows)
      if (filter === "all" || filter === "topics") {
        const topicQuery = supabase
          .from("topics")
          .select(
            `
            id,
            title,
            content,
            slug,
            created_at,
            reply_count,
            view_count,
            author_id,
            categories (name, color, slug)
            `
          )
          .eq("moderation_status", "approved");

        // For multiple words, get broader results and filter client-side
        const searchConditions = searchWords
          .map((word) => `title.ilike.%${word}%,content.ilike.%${word}%`)
          .join(",");

        const { data: topicResults, error: topicError } = await topicQuery
          .or(searchConditions)
          .order("created_at", { ascending: false })
          .limit(200); // Increased limit for client-side filtering

        if (topicError) {
          console.error("Error searching topics:", topicError);
          throw topicError;
        }

        // Filter results client-side to ensure ALL words are present
        const filteredTopics =
          topicResults?.filter((topic) => {
            const titleContent = `${topic.title} ${
              topic.content || ""
            }`.toLowerCase();
            return searchWords.every((word) =>
              titleContent.includes(word.toLowerCase())
            );
          }) || [];

        // Get author data for topics
        const topicAuthorIds = [
          ...new Set(
            filteredTopics
              .map((topic) => topic.author_id)
              .filter((id): id is string => id !== null) // Correctly filter out nulls
          ),
        ];
        const [topicProfilesData, topicTempUsersData] = await Promise.all([
          topicAuthorIds.length > 0
            ? supabase
                .from("profiles")
                .select("id, username")
                .in("id", topicAuthorIds)
                .then(({ data }) => data || [])
            : Promise.resolve([]),

          topicAuthorIds.length > 0
            ? supabase
                .from("temporary_users")
                .select("id, display_name")
                .in("id", topicAuthorIds)
                .then(({ data }) => data || [])
            : Promise.resolve([]),
        ]);

        // Create user map for topics
        const topicUserMap = new Map<string, string>(); // Explicitly type Map
        topicProfilesData.forEach((profile) => {
          topicUserMap.set(profile.id, profile.username);
        });
        topicTempUsersData.forEach((tempUser) => {
          topicUserMap.set(tempUser.id, "Guest");
        });

        // Add topic results
        filteredTopics.forEach((topic) => {
          const authorUsername = topic.author_id
            ? topicUserMap.get(topic.author_id) || "Anonymous User"
            : "Anonymous User";
          results.push({
            id: topic.id,
            title: topic.title,
            content: topic.content || null, // Ensure content is string or null
            type: "topic",
            author_username: authorUsername,
            category_name: topic.categories?.name || "Unknown",
            category_color: topic.categories?.color || "#3b82f6",
            category_slug: topic.categories?.slug || null, // Ensure slug is string or null
            slug: topic.slug || null, // Ensure slug is string or null
            reply_count: topic.reply_count ?? 0, // Use nullish coalescing
            view_count: topic.view_count ?? 0, // Use nullish coalescing
            created_at: topic.created_at || null, // Ensure created_at is string or null
          });
        });
      }

      // Search in posts (if filter allows)
      if (filter === "all" || filter === "posts") {
        // For posts, search in content field
        const searchConditions = searchWords
          .map((word) => `content.ilike.%${word}%`)
          .join(",");

        const { data: postResults, error: postError } = await supabase
          .from("posts")
          .select(
            `
            id,
            content,
            created_at,
            author_id
            `
          )
          .eq("moderation_status", "approved")
          .or(searchConditions)
          .order("created_at", { ascending: false })
          .limit(200); // Increased limit for client-side filtering

        if (postError) {
          console.error("Error searching posts:", postError);
          throw postError;
        }

        // Filter results client-side to ensure ALL words are present
        const filteredPosts =
          postResults?.filter((post) => {
            const content = (post.content || "").toLowerCase(); // Handle null content
            return searchWords.every((word) =>
              content.includes(word.toLowerCase())
            );
          }) || [];

        // Add post results (simplified for now)
        filteredPosts.forEach((post) => {
          results.push({
            id: post.id,
            title: "Post", // Default title for posts
            content: post.content || null, // Ensure content is string or null
            type: "post",
            author_username: "Anonymous User", // Placeholder, as author info for posts isn't fetched here
            category_name: "Unknown", // Placeholder
            category_color: "#3b82f6", // Default color
            reply_count: 0,
            view_count: 0,
            created_at: post.created_at || null, // Ensure created_at is string or null
          });
        });
      }

      // Search in categories (if filter allows)
      if (filter === "all" || filter === "categories") {
        // For categories, search in name and description
        const searchConditions = searchWords
          .map((word) => `name.ilike.%${word}%,description.ilike.%${word}%`)
          .join(",");

        const { data: categoryResults, error: categoryError } = await supabase
          .from("categories")
          .select(
            `
            id,
            name,
            description,
            color,
            slug,
            created_at
            `
          )
          .or(searchConditions)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(100); // Increased limit for client-side filtering

        if (categoryError) {
          console.error("Error searching categories:", categoryError);
          throw categoryError;
        }

        // Filter results client-side to ensure ALL words are present
        const filteredCategories =
          categoryResults?.filter((category) => {
            const nameDescription = `${category.name} ${
              category.description || ""
            }`.toLowerCase();
            return searchWords.every((word) =>
              nameDescription.includes(word.toLowerCase())
            );
          }) || [];

        // Add category results
        filteredCategories.forEach((category) => {
          results.push({
            id: category.id,
            title: category.name,
            content: category.description || null, // Ensure content is string or null
            type: "category",
            author_username: "System", // Categories are system-managed
            category_name: category.name,
            category_color: category.color || "#3b82f6",
            category_slug: category.slug || null, // Ensure slug is string or null
            reply_count: 0,
            view_count: 0,
            created_at: category.created_at || null, // Ensure created_at is string or null
          });
        });
      }

      // Sort by creation date (most recent first)
      return results.sort(
        (a, b) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime() // Handle potential null for Date constructor
      );
    },
    enabled: !!query && query.trim().length >= 2,
  });
};
