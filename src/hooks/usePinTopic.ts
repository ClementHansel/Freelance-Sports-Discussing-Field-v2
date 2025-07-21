"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PinTopicParams {
  topicId: string;
  isPinned: boolean;
}

export const usePinTopic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ topicId, isPinned }: PinTopicParams) => {
      const { data, error } = await supabase
        .from("topics")
        .update({
          is_pinned: isPinned,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate topic queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["topic"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });

      toast({
        title: "Success",
        description: variables.isPinned
          ? "Topic pinned successfully"
          : "Topic unpinned successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating topic pin status:", error);
      toast({
        title: "Error",
        description: "Failed to update topic pin status",
        variant: "destructive",
      });
    },
  });
};
