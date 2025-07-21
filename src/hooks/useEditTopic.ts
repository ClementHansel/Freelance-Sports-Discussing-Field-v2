"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditTopicParams {
  topicId: string;
  title: string;
  content: string;
}

export const useEditTopic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ topicId, title, content }: EditTopicParams) => {
      const { data, error } = await supabase
        .from("topics")
        .update({
          title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate topic queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["topic"] });
      toast({
        title: "Success",
        description: "Topic updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating topic:", error);
      toast({
        title: "Error",
        description: "Failed to update topic",
        variant: "destructive",
      });
    },
  });
};
