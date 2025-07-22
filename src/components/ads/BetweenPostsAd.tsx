"use client";

import React from "react";
import { DynamicAdSpace } from "./DynamicAdSpace";
import { useForumSettings } from "@/hooks/useForumSettings";

interface BetweenPostsAdProps {
  postIndex: number;
  className?: string;
}

export const BetweenPostsAd: React.FC<BetweenPostsAdProps> = ({
  postIndex,
  className = "",
}) => {
  const { getSetting } = useForumSettings();
  // Cast the return value of getSetting to string before passing to parseInt
  const frequency = parseInt(
    getSetting("ads_between_posts_frequency", "3") as string
  );

  // Show ad after every N posts (where N is the frequency setting)
  const shouldShowAd = postIndex > 0 && (postIndex + 1) % frequency === 0;

  if (!shouldShowAd) {
    return null;
  }

  return (
    <div className={`between-posts-ad my-6 ${className}`}>
      <DynamicAdSpace location="between_posts" />
    </div>
  );
};
