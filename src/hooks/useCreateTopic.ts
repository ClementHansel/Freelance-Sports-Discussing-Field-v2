"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateSlugFromTitle } from "@/lib/utils/urlHelpers";
import { useAuth } from "./useAuth";
import { sessionManager } from "@/lib/utils/sessionManager";
import { getMandatoryUserIP } from "@/lib/utils/ipUtils";
import { Database, Json } from "@/integrations/supabase/types"; // Import Database and Json

interface CreateTopicData {
  title: string;
  content: string;
  category_id: string;
}

// Define the expected structure for the category data with joined categories
type CategoryInfo = Database["public"]["Tables"]["categories"]["Row"] & {
  level: number;
  name: string;
  requires_moderation: boolean;
};

// Define the type for a new topic inserted into the database
type NewTopic = Database["public"]["Tables"]["topics"]["Insert"];

// Define the type for a topic returned after insertion (with joined category data)
type InsertedTopic = Database["public"]["Tables"]["topics"]["Row"] & {
  categories: {
    // This matches the 'select' query for categories
    name: string;
    slug: string;
    color: string | null; // <--- CHANGED: Allow color to be null
  } | null; // Can be null if the join fails or category doesn't exist
};

export const useCreateTopic = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<InsertedTopic, Error, CreateTopicData>({
    // Explicitly type mutation: Result, Error, Variables
    mutationFn: async (data: CreateTopicData) => {
      console.log("Creating topic:", data);

      // Get user's IP address for tracking - MANDATORY
      let userIP: string;
      try {
        userIP = await getMandatoryUserIP();
        console.log("DEBUG TOPIC: Got mandatory user IP:", userIP);
      } catch (ipError) {
        console.error("Failed to get IP address:", ipError);
        throw new Error(
          "Unable to determine your IP address. Please check your network connection and try again."
        );
      }

      // Get category info including moderation requirements
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("level, name, requires_moderation")
        .eq("id", data.category_id)
        .single();

      if (categoryError) {
        throw new Error("Invalid category selected");
      }

      if (!category) {
        // Add null check for category
        throw new Error("Category not found.");
      }

      if (category.level !== 2 && category.level !== 3) {
        throw new Error(
          `Topics can only be created in discussion or age group categories. "${category.name}" is for browsing only.`
        );
      }

      // Generate slug from title with unique suffix
      const baseSlug = generateSlugFromTitle(data.title);
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      let isTemporaryUser = false;
      let authorId: string;

      if (user) {
        // Check if this is a temporary user
        // The RPC 'is_temporary_user' should ideally return a boolean
        const { data: tempUserCheck, error: tempUserCheckError } =
          await supabase.rpc("is_temporary_user", { user_id: user.id });

        if (tempUserCheckError) {
          console.error(
            "Error checking temporary user status:",
            tempUserCheckError
          );
          // Decide whether to throw or default to false. Defaulting to false for now.
          isTemporaryUser = false;
        } else {
          isTemporaryUser = (tempUserCheck as boolean) || false; // Cast to boolean
        }

        authorId = user.id;
        console.log(
          "DEBUG TOPIC: Creating topic for user:",
          user.id,
          "isTemporary:",
          isTemporaryUser
        );
      } else {
        // Anonymous user - use temporary user ID
        const tempUserId = sessionManager.getTempUserId();
        console.log("DEBUG TOPIC: Got temp user ID:", tempUserId);
        if (!tempUserId) {
          throw new Error("No temporary user session available");
        }
        authorId = tempUserId;
        isTemporaryUser = true;
        console.log(
          "DEBUG TOPIC: Creating topic with temporary user ID:",
          tempUserId
        );
      }

      const topicData: NewTopic = {
        // Typed topicData as NewTopic (Insert type)
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        slug: uniqueSlug,
        is_pinned: false,
        is_locked: false,
        view_count: 0,
        reply_count: 0,
        last_reply_at: new Date().toISOString(),
        moderation_status: category.requires_moderation
          ? "pending"
          : "approved",
        ip_address: userIP,
        is_anonymous: !user || isTemporaryUser, // Mark temporary users as anonymous
        author_id: authorId,
      };

      console.log("DEBUG TOPIC: Final topicData before insert:", topicData);

      const { data: topic, error } = await supabase
        .from("topics")
        .insert(topicData)
        .select(
          `
          *,
          categories (name, slug, color)
          `
        )
        .single();

      if (error) {
        console.error("Error creating topic:", error);
        throw error;
      }

      if (!topic) {
        // Add null check for inserted topic
        throw new Error("Topic creation failed: No topic data returned.");
      }

      console.log("Topic created successfully:", topic);

      // Log IP activity for topic creation - IP is guaranteed to exist
      try {
        const sessionId = sessionManager.getSessionId();
        await supabase.rpc("log_ip_activity", {
          p_ip_address: userIP,
          // Ensure p_session_id is always a string, provide a fallback if sessionId is null
          p_session_id: sessionId || "unknown_session",
          p_activity_type: "topic_creation",
          p_content_id: topic.id,
          p_content_type: "topic",
          p_action_data: {
            // p_action_data expects Json
            title: data.title,
            category_id: data.category_id,
            author_type: user ? "authenticated" : "anonymous",
          } as Json, // Explicitly cast to Json
        });
      } catch (logError: unknown) {
        // Type error as unknown
        let errorMessage = "Failed to log IP activity";
        if (logError instanceof Error) {
          errorMessage = logError.message;
        } else if (typeof logError === "string") {
          errorMessage = logError;
        } else if (
          typeof logError === "object" &&
          logError !== null &&
          "message" in logError &&
          typeof (logError as { message: unknown }).message === "string"
        ) {
          errorMessage = (logError as { message: string }).message;
        }
        console.error(
          "Failed to log IP activity for topic creation:",
          errorMessage
        );
        // Don't throw - topic creation was successful
      }

      return topic;
    },
    onSuccess: (topic) => {
      // 'topic' is now InsertedTopic
      // Invalidate and refetch topics for the category
      queryClient.invalidateQueries({
        queryKey: ["topics", topic.category_id],
      });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      // Invalidate specific topic queries if they exist
      queryClient.invalidateQueries({ queryKey: ["hot-topics"] });
      queryClient.invalidateQueries({ queryKey: ["most-viewed-topics"] });
      queryClient.invalidateQueries({ queryKey: ["most-commented-topics"] });
    },
    onError: (error: unknown) => {
      // Type error as unknown
      let errorMessage = "Failed to create topic";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Topic creation error:", errorMessage);
      // You might want to add a toast here as well for user feedback
      // toast({ title: "Error creating topic", description: errorMessage, variant: "destructive" });
    },
  });
};
