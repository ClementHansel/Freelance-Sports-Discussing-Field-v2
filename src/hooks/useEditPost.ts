"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditPostParams {
  postId: string;
  content: string;
}

export const useEditPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content }: EditPostParams) => {
      const { data, error } = await supabase
        .from("posts")
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate posts queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    },
  });
};
