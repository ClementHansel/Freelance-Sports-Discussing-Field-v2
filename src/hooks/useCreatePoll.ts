"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CreatePollData {
  question: string;
  description?: string;
  options: string[];
  isMultipleChoice?: boolean;
  allowAnonymousVotes?: boolean;
  expiresAt?: Date;
}

export const useCreatePoll = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      topicId,
      pollData,
    }: {
      topicId: string;
      pollData: CreatePollData;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to create polls");
      }

      // First create the poll
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          topic_id: topicId,
          question: pollData.question,
          description: pollData.description,
          is_multiple_choice: pollData.isMultipleChoice || false,
          allow_anonymous_votes: pollData.allowAnonymousVotes || false,
          expires_at: pollData.expiresAt?.toISOString(),
          created_by: user.user.id,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Then create the poll options
      const optionsData = pollData.options.map((option, index) => ({
        poll_id: poll.id,
        option_text: option,
        display_order: index,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) throw optionsError;

      return poll;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Poll created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
    onError: (error) => {
      console.error("Error creating poll:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create poll",
        variant: "destructive",
      });
    },
  });
};
