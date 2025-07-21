"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (topicId: string) => {
      // First get topic details and count posts for audit logging
      const { data: topic, error: fetchError } = await supabase
        .from("topics")
        .select(
          "id, title, content, author_id, category_id, created_at, reply_count"
        )
        .eq("id", topicId)
        .single();

      if (fetchError) throw fetchError;

      // Check if topic has posts - prevent deletion if it does to avoid mass deletion
      const { count: postCount, error: countError } = await supabase
        .from("posts")
        .select("id", { count: "exact" })
        .eq("topic_id", topicId);

      if (countError) throw countError;

      if (postCount && postCount > 0) {
        throw new Error(
          `Cannot delete topic: ${postCount} posts will be affected. Please delete posts individually first.`
        );
      }

      // Delete the topic
      const { error } = await supabase
        .from("topics")
        .delete()
        .eq("id", topicId);

      if (error) throw error;

      // Log the admin action
      if (user?.role === "admin" && topic) {
        try {
          await supabase.rpc("log_admin_action", {
            p_admin_user_id: user.id,
            p_action_type: "delete_topic",
            p_target_type: "topic",
            p_target_id: topicId,
            p_target_details: {
              title: topic.title,
              content: topic.content?.substring(0, 100) + "..." || "",
              author_id: topic.author_id,
              category_id: topic.category_id,
              reply_count: topic.reply_count,
              created_at: topic.created_at,
            },
          });
        } catch (auditError) {
          console.error("Failed to log admin action:", auditError);
        }
      }

      return topic;
    },
    onSuccess: (deletedTopic) => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic"] });
      queryClient.invalidateQueries({ queryKey: ["hot-topics"] });
      toast({
        title: "Topic deleted",
        description: "The topic has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description:
          error.message || "Failed to delete the topic. Please try again.",
        variant: "destructive",
      });
      console.error("Delete topic error:", error);
    },
  });
};
