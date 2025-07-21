"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, Tables } from "@/integrations/supabase/types"; // Import Database and Tables types

// Define a type for the author information to avoid 'any' and resolve type errors
type AuthorInfo =
  | { profiles: Tables<"profiles"> } // Corrected: Tables<'profiles'> directly gives the Row type
  | { temporary_users: Tables<"temporary_users"> } // Corrected: Tables<'temporary_users'> directly gives the Row type
  | null;

// Define the exact return type for the useTopic hook, including joined data and custom fields
export type FullTopicDetails = Tables<"topics"> & {
  // Corrected: Tables<'topics'> directly gives the Row type
  categories: Tables<"categories"> | null; // Joined category data (Corrected: Tables<'categories'>)
  profiles?: Tables<"profiles"> | null; // Joined profile data (if author is a registered user) (Corrected: Tables<'profiles'>)
  temporary_users?: Tables<"temporary_users"> | null; // Joined temporary user data (if author is anonymous) (Corrected: Tables<'temporary_users'>)
  last_post_id: string | null; // Manually added in queryFn
};

export const useTopic = (identifier: string) => {
  return useQuery<FullTopicDetails | null>({
    // Explicitly type the useQuery return
    queryKey: ["topic", identifier],
    queryFn: async () => {
      console.log("Fetching topic by identifier:", identifier);

      // Check if identifier is a UUID (legacy) or a slug
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          identifier
        );

      // Use the `Database` types for type-safe queries
      let query = supabase
        .from("topics")
        .select(
          `
          *,
          categories (name, color, slug, parent_category_id)
          `
        )
        .eq("moderation_status", "approved");

      if (isUUID) {
        query = query.eq("id", identifier);
      } else {
        query = query.eq("slug", identifier);
      }

      // Explicitly type the result of the select query
      const { data: topicData, error } = await query.single<
        Tables<"topics"> & { categories: Tables<"categories"> }
      >(); // Corrected: Tables<'topics'> and Tables<'categories'>

      if (error) {
        console.error("Error fetching topic:", error);
        // If no rows found, return null instead of throwing an error for a 404 scenario
        if (error.code === "PGRST116") {
          // Supabase code for no rows found
          return null;
        }
        throw error;
      }

      // Fetch author information separately based on whether it's a temporary user or regular user
      let profiles: Tables<"profiles"> | null = null; // Corrected: Tables<'profiles'>
      let temporary_users: Tables<"temporary_users"> | null = null; // Corrected: Tables<'temporary_users'>

      if (topicData.author_id) {
        // First try to get from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("*") // Select all columns for the profile
          .eq("id", topicData.author_id)
          .maybeSingle<Tables<"profiles">>(); // Corrected: Tables<'profiles'>

        if (profile) {
          profiles = profile;
        } else {
          // Try temporary users
          const { data: tempUser } = await supabase
            .from("temporary_users")
            .select("*") // Select all columns for the temporary user
            .eq("id", topicData.author_id)
            .maybeSingle<Tables<"temporary_users">>(); // Corrected: Tables<'temporary_users'>

          if (tempUser) {
            temporary_users = tempUser;
          }
        }
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
          .maybeSingle<Tables<"posts">>(); // Corrected: Tables<'posts'>
        lastPostId = lastPost?.id || null;
      }

      // Combine the data into the FullTopicDetails type
      const result: FullTopicDetails = {
        ...topicData,
        categories: topicData.categories, // Ensure categories is explicitly included
        profiles: profiles,
        temporary_users: temporary_users,
        last_post_id: lastPostId,
      };

      // Increment view count using the topic ID
      await supabase.rpc("increment_view_count", { topic_id: result.id });

      console.log("Topic fetched:", result);
      return result;
    },
    enabled: !!identifier,
  });
};
