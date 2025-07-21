"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define a type for the author information to avoid 'any' and resolve type errors
type AuthorInfo =
  | { profiles: { username: string; avatar_url: string | null } }
  | { temporary_users: { display_name: string } }
  | null;

export const useTopicByPath = (
  categorySlug: string,
  subcategorySlug?: string,
  topicSlug?: string
) => {
  return useQuery({
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

      // Get topic by slug and category
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select(
          `
          *,
          categories (name, color, slug, parent_category_id, parent_category:categories!parent_category_id(slug, name))
          `
        )
        .eq("slug", topicSlug)
        .eq("category_id", categoryData.id)
        .single();

      if (topicError) {
        console.error("Error fetching topic:", topicError);
        throw topicError;
      }

      // Fetch author information separately based on whether it's a temporary user or regular user
      let authorInfo: AuthorInfo = null; // Explicitly type authorInfo
      if (topicData.author_id) {
        // First try to get from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", topicData.author_id)
          .maybeSingle();

        if (profile) {
          authorInfo = { profiles: profile };
        } else {
          // Try temporary users
          const { data: tempUser } = await supabase
            .from("temporary_users")
            .select("display_name")
            .eq("id", topicData.author_id)
            .maybeSingle();

          if (tempUser) {
            authorInfo = { temporary_users: { display_name: "Guest" } };
          }
        }
      }

      // Combine the data, conditionally spreading authorInfo
      const data = {
        ...topicData,
        ...(authorInfo || {}), // Only spread if authorInfo is not null
      };

      // Increment view count
      await supabase.rpc("increment_view_count", { topic_id: data.id });

      console.log("Topic fetched by path:", data);
      return data;
    },
    enabled: !!categorySlug && !!topicSlug,
  });
};
