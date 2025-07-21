"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      // First get post details for audit logging
      const { data: post, error: fetchError } = await supabase
        .from("posts")
        .select("id, content, author_id, topic_id, created_at")
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the post
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      // Log the admin action
      if (user?.role === "admin" && post) {
        try {
          await supabase.rpc("log_admin_action", {
            p_admin_user_id: user.id,
            p_action_type: "delete_post",
            p_target_type: "post",
            p_target_id: postId,
            p_target_details: {
              content: post.content?.substring(0, 100) + "...",
              author_id: post.author_id,
              topic_id: post.topic_id,
              created_at: post.created_at,
            },
          });
        } catch (auditError) {
          console.error("Failed to log admin action:", auditError);
        }
      }

      // Update reply count for the topic
      if (post?.topic_id) {
        const { error: incrementError } = await supabase.rpc(
          "increment_reply_count",
          {
            topic_id: post.topic_id,
          }
        );

        if (incrementError) {
          console.error("Error updating reply count:", incrementError);
        }
      }

      return post;
    },
    onSuccess: (deletedPost) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["topic"] });
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the post. Please try again.",
        variant: "destructive",
      });
      console.error("Delete post error:", error);
    },
  });
};
