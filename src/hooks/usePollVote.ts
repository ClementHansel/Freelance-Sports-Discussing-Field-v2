"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePollVote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      pollId,
      optionId,
    }: {
      pollId: string;
      optionId: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to vote");
      }

      // First check if poll allows multiple votes
      const { data: poll } = await supabase
        .from("polls")
        .select("is_multiple_choice")
        .eq("id", pollId)
        .single();

      if (!poll) {
        throw new Error("Poll not found");
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from("poll_votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("voter_id", user.user.id)
        .single();

      if (existingVote && !poll.is_multiple_choice) {
        // For single choice polls, update the existing vote
        const { error } = await supabase
          .from("poll_votes")
          .update({ option_id: optionId })
          .eq("id", existingVote.id);

        if (error) throw error;
      } else {
        // For multiple choice polls or first vote, insert new vote
        const { error } = await supabase.from("poll_votes").insert({
          poll_id: pollId,
          option_id: optionId,
          voter_id: user.user.id,
        });

        if (error) throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["poll-results"] });
    },
    onError: (error) => {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });
};
