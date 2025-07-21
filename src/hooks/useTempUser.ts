"use client";

import { useState, useEffect } from "react";
import { sessionManager, TempUser } from "@/lib/utils/sessionManager";
import { validateAnonymousContent } from "@/lib//utils/anonymousUtils";

interface TempUserState {
  tempUser: TempUser | null;
  isLoading: boolean;
  canPost: boolean;
  remainingPosts: number;
}

export const useTempUser = () => {
  const [state, setState] = useState<TempUserState>({
    tempUser: null,
    isLoading: true,
    canPost: false,
    remainingPosts: 0,
  });

  useEffect(() => {
    initializeTempUser();
  }, []);

  const initializeTempUser = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Initialize session and get temp user ID
      await sessionManager.initializeSession();

      // Get temp user data
      const tempUser = await sessionManager.getTempUserData();

      // Check rate limit
      const { canPost, remainingPosts } = await sessionManager.checkRateLimit();

      setState({
        tempUser,
        isLoading: false,
        canPost,
        remainingPosts,
      });
    } catch (error) {
      console.error("Error initializing temp user:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        canPost: false,
        remainingPosts: 0,
      }));
    }
  };

  const refreshRateLimit = async () => {
    try {
      const { canPost, remainingPosts } = await sessionManager.checkRateLimit();
      setState((prev) => ({ ...prev, canPost, remainingPosts }));
    } catch (error) {
      console.error("Error refreshing rate limit:", error);
    }
  };

  const validateContent = (content: string) => {
    return validateAnonymousContent(content);
  };

  const getTempUserId = () => {
    return sessionManager.getTempUserId();
  };

  const recordPost = async () => {
    await sessionManager.recordPost();
  };

  return {
    ...state,
    refreshRateLimit,
    validateContent,
    getTempUserId,
    recordPost,
  };
};
