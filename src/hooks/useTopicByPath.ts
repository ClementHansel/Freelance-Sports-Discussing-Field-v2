// src/hooks/useTopicByPath.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Topic as UseTopicsTopic } from "./useTopics"; // Import the Topic interface from useTopics
import { Database, Tables } from "@/integrations/supabase/types"; // Import Database and Tables types

// Define a type for the data returned directly from the Supabase select query
// This needs to include all columns from 'topics' table AND the selected joined columns.
type TopicQueryResult = Tables<"topics"> & {
  categories: Tables<"categories"> | null;
  profiles: Tables<"profiles"> | null;
  is_hidden: boolean | null;
  hot_score: number | null;
  last_post_id: string | null;
  is_public: boolean | null;
  ip_address: unknown; // Keep as unknown as per Supabase types.ts
};

// Define the options interface for useTopicByPath
interface UseTopicByPathOptions {
  categorySlug: string;
  subcategorySlug?: string;
  topicSlug?: string;
  initialData?: UseTopicsTopic | null; // Allow initial data for SSR hydration
  enabled?: boolean; // Allow disabling the query
}

export const useTopicByPath = (
  options: UseTopicByPathOptions, // Accept a single options object
) => {
  const {
    categorySlug,
    subcategorySlug,
    topicSlug,
    initialData,
    enabled = true,
  } = options;

  return useQuery<UseTopicsTopic | null>({ // Explicitly type the query result
    queryKey: ["topic-by-path", categorySlug, subcategorySlug, topicSlug],
    queryFn: async () => {
      console.log("Fetching topic by path:", {
        categorySlug,
        subcategorySlug,
        topicSlug,
      });

      // If no topicSlug, this is a category view
      if (!topicSlug) {
        return null;
      }

      // Get category ID first - handle hierarchical structure
      let categoryData;
      let categoryError;

      if (subcategorySlug) {
        // Hierarchical: validate parent-child relationship
        const { data: parentCategory, error: parentError } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();

        if (parentError) {
          console.error("Error fetching parent category:", parentError);
          throw parentError;
        }

        const { data: childCategory, error: childError } = await supabase
          .from("categories")
          .select("id, parent_category_id")
          .eq("slug", subcategorySlug)
          .eq("parent_category_id", parentCategory.id)
          .single();

        categoryData = childCategory;
        categoryError = childError;
      } else {
        // Single category
        const { data, error } = await supabase
          .from("categories")
          .select("id, parent_category_id")
          .eq("slug", categorySlug)
          .single();

        categoryData = data;
        categoryError = error;
      }

      if (categoryError) {
        console.error("Error fetching category:", categoryError);
        throw categoryError;
      }

      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select(
          `
          *,
          profiles ( username, avatar_url, id, bio, created_at, reputation, updated_at ),
          categories ( id, name, slug, color, parent_category_id )
          `, // Expanded select to include all fields needed by UseTopicsTopic
        )
        .eq("slug", topicSlug)
        .eq("category_id", categoryData.id)
        .single<TopicQueryResult>(); // Explicitly type the result of the select query

      if (topicError) {
        console.error("Error fetching topic:", topicError);
        throw topicError;
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
        last_post_id: topicData.last_post_id ?? null, // Use nullish coalescing
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

      // Increment view count
      await supabase.rpc("increment_view_count", { topic_id: mappedTopic.id });

      console.log("Topic fetched by path:", mappedTopic);
      return mappedTopic;
    },
    enabled: enabled && !!categorySlug && !!topicSlug, // Use the enabled option
    initialData: initialData, // Hydrate with initial data
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
