"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PollResult {
  option_id: string;
  option_text: string;
  display_order: number;
  vote_count: number;
  percentage: number;
}

export const usePollResults = (pollId: string) => {
  return useQuery({
    queryKey: ["poll-results", pollId],
    queryFn: async (): Promise<PollResult[]> => {
      const { data, error } = await supabase.rpc("get_poll_results", {
        poll_id_param: pollId,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!pollId,
  });
};

export const usePollsByTopic = (topicId: string) => {
  return useQuery({
    queryKey: ["polls", topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select(
          `
          *,
          poll_options (
            id,
            option_text,
            display_order
          )
        `
        )
        .eq("topic_id", topicId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!topicId,
  });
};

export const useUserPollVotes = (pollId: string) => {
  return useQuery({
    queryKey: ["user-poll-votes", pollId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("poll_id", pollId)
        .eq("voter_id", user.user.id);

      if (error) throw error;
      return data?.map((vote) => vote.option_id) || [];
    },
    enabled: !!pollId,
  });
};
