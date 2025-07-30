// src/hooks/useTopic.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, Tables } from "@/integrations/supabase/types"; // Import Database and Tables types
import { Topic as UseTopicsTopic } from "./useTopics"; // Import the Topic interface from useTopics

// Define the options interface for useTopic
interface UseTopicOptions {
  identifier: string; // Now the identifier is part of the options object
  initialData?: UseTopicsTopic | null; // Allow initial data for SSR hydration
  enabled?: boolean; // Allow disabling the query
}

// Define the exact return type for the useTopic hook, including joined data and custom fields
// This should match UseTopicsTopic from useTopics.ts
export type FullTopicDetails = UseTopicsTopic;

// Define a type for the data returned directly from the Supabase select query
// This needs to include all columns from 'topics' table AND the selected joined columns.
type TopicQueryResult = Tables<"topics"> & {
  categories: Tables<"categories"> | null;
  profiles: Tables<"profiles"> | null;
  // Explicitly include any other fields that are part of the 'topics' table
  // but might be typed as 'unknown' or missing from the auto-generated Tables<'topics'>
  // if they are not standard types or are added later.
  // For 'ip_address', it's 'inet' in Supabase, which maps to 'unknown' in types.ts.
  // We'll cast it during mapping.
  is_hidden: boolean | null;
  hot_score: number | null;
  last_post_id: string | null;
  is_public: boolean | null;
  ip_address: unknown; // Keep as unknown as per Supabase types.ts
};

export const useTopic = (
  options: UseTopicOptions, // Accept a single options object
) => {
  const { identifier, initialData, enabled = true } = options;

  return useQuery<FullTopicDetails | null>({ // Explicitly type the useQuery return
    queryKey: ["topic", identifier],
    queryFn: async () => {
      console.log("Fetching topic by identifier:", identifier);

      // Check if identifier is a UUID (legacy) or a slug
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          identifier,
        );

      // Use the `Database` types for type-safe queries
      let query = supabase
        .from("topics")
        .select(
          `
          *,
          categories (name, color, slug, parent_category_id),
          profiles ( username, avatar_url, id, bio, created_at, reputation, updated_at )
          `, // Expanded select to include all fields needed by UseTopicsTopic
        )
        .eq("moderation_status", "approved");

      if (isUUID) {
        query = query.eq("id", identifier);
      } else {
        query = query.eq("slug", identifier);
      }

      const { data: topicData, error } = await query.single<TopicQueryResult>();

      if (error) {
        console.error("Error fetching topic:", error);
        // If no rows found, return null instead of throwing an error for a 404 scenario
        if (error.code === "PGRST116") {
          // Supabase code for no rows found
          return null;
        }
        throw error;
      }

      // Get last post ID if topic has replies
      let lastPostId: string | null = null;
      if ((topicData.reply_count ?? 0) > 0) {
        const { data: lastPost } = await supabase
          .from("posts")
          .select("id")
          .eq("topic_id", topicData.id)
          .eq("moderation_status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<Tables<"posts">>();
        lastPostId = lastPost?.id || null;
      }

      // Map topicData to UseTopicsTopic, ensuring all fields are present and correctly typed
      const mappedTopic: UseTopicsTopic = {
        id: topicData.id,
        title: topicData.title,
        content: topicData.content || null,
        author_id: topicData.author_id || null,
        category_id: topicData.category_id,
        is_pinned: topicData.is_pinned || null,
        is_locked: topicData.is_locked || null,
        // These fields might not be directly in TopicQueryResult from a simple select,
        // so we explicitly map them or default to null.
        is_hidden: topicData.is_hidden ?? null, // Use nullish coalescing
        view_count: topicData.view_count || null,
        reply_count: topicData.reply_count || null,
        last_reply_at: topicData.last_reply_at || null,
        created_at: topicData.created_at || null,
        updated_at: topicData.updated_at || null,
        slug: topicData.slug || null,
        hot_score: topicData.hot_score ?? null, // Use nullish coalescing
        last_post_id: lastPostId, // Use the fetched lastPostId
        moderation_status: topicData.moderation_status || null,
        ip_address: (topicData.ip_address as string) || null, // Cast 'unknown' to 'string' then nullish coalescing
        is_anonymous: topicData.is_anonymous ?? null, // Use nullish coalescing
        is_public: topicData.is_public ?? null, // Use nullish coalescing
        canonical_url: topicData.canonical_url || null,
        profiles: topicData.profiles
          ? {
            username: topicData.profiles.username,
            avatar_url: topicData.profiles.avatar_url,
            id: topicData.profiles.id,
            bio: topicData.profiles.bio,
            created_at: topicData.profiles.created_at,
            reputation: topicData.profiles.reputation,
            updated_at: topicData.profiles.updated_at,
          }
          : null,
        categories: topicData.categories
          ? {
            id: topicData.categories.id,
            name: topicData.categories.name,
            color: topicData.categories.color,
            slug: topicData.categories.slug,
            parent_category_id: topicData.categories.parent_category_id || null,
          }
          : null,
      };

      // Increment view count using the topic ID
      await supabase.rpc("increment_view_count", { topic_id: mappedTopic.id });

      console.log("Topic fetched:", mappedTopic);
      return mappedTopic;
    },
    enabled: enabled && !!identifier,
    initialData: initialData, // Hydrate with initial data
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
