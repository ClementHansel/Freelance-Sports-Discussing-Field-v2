import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Check, Clock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePollResults, useUserPollVotes } from "@/hooks/usePollResults";
import { usePollVote } from "@/hooks/usePollVote";
import { formatDistanceToNow } from "date-fns";

export interface Poll {
  id: string;
  question: string;
  description?: string | null; // Updated to allow null
  is_multiple_choice: boolean;
  allow_anonymous_votes: boolean;
  expires_at?: string | null; // Updated to allow null
  created_at: string;
  poll_options: Array<{
    id: string;
    option_text: string;
    display_order: number;
  }>;
}

interface PollDisplayProps {
  poll: Poll;
}

export const PollDisplay: React.FC<PollDisplayProps> = ({ poll }) => {
  const { user } = useAuth();
  const { data: results = [] } = usePollResults(poll.id);
  const { data: userVotes = [] } = useUserPollVotes(poll.id);
  const { mutate: vote, isPending: isVoting } = usePollVote();

  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const canVote = user && !isExpired;
  const hasVoted = userVotes.length > 0;
  const totalVotes = results.reduce(
    (sum, result) => sum + result.vote_count,
    0
  );

  const handleVote = (optionId: string) => {
    if (!canVote) return;

    vote({
      pollId: poll.id,
      optionId: optionId,
    });
  };

  const getMaxVoteCount = () => {
    return Math.max(...results.map((r) => r.vote_count), 1);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">{poll.question}</h3>
            {poll.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {poll.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {poll.is_multiple_choice && (
            <Badge variant="secondary" className="text-xs">
              Multiple Choice
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {results.map((result) => {
          const isUserVote = userVotes.includes(result.option_id);
          const isWinning =
            result.vote_count === getMaxVoteCount() && result.vote_count > 0;

          return (
            <div key={result.option_id} className="space-y-1">
              {canVote && !hasVoted ? (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleVote(result.option_id)}
                  disabled={isVoting}
                >
                  <span className="flex-1 text-left">{result.option_text}</span>
                </Button>
              ) : (
                <div className="relative">
                  <div
                    className={`
                    border rounded-md p-3 
                    ${
                      isUserVote
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }
                    ${isWinning ? "ring-2 ring-primary/20" : ""}
                  `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {result.option_text}
                        </span>
                        {isUserVote && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{result.vote_count} votes</span>
                        <span>({result.percentage}%)</span>
                      </div>
                    </div>
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalVotes} total votes</span>
          </div>
          {poll.expires_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {isExpired
                  ? `Expired ${formatDistanceToNow(
                      new Date(poll.expires_at)
                    )} ago`
                  : `Expires ${formatDistanceToNow(
                      new Date(poll.expires_at)
                    )} from now`}
              </span>
            </div>
          )}
        </div>
        <span>
          Created {formatDistanceToNow(new Date(poll.created_at))} ago
        </span>
      </div>

      {!user && (
        <div className="text-center text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">
            Sign in to vote
          </a>
        </div>
      )}
    </Card>
  );
};
