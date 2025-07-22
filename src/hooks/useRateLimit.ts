"use client";

import { useState, useCallback } from "react";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // How long to block after exceeding limit
}

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

export const useRateLimit = (key: string, config: RateLimitConfig) => {
  const { maxAttempts, windowMs, blockDurationMs = 60000 } = config;

  // getStorageKey is a simple function that only depends on the 'key' argument.
  // It doesn't need to be memoized with useCallback or have 'key' in its dependencies
  // if it's defined outside the component or as a simple helper.
  // However, if it's inside the component, it implicitly depends on 'key'.
  // For simplicity and to avoid the lint warning, we can define it directly.
  const getStorageKey = (k: string) => `rate_limit_${k}`; // Use 'k' to avoid confusion with hook's 'key'

  // Removed 'key' from dependencies because getStorageKey(key) is stable
  // and 'key' itself is a primitive value passed directly to the hook.
  const getRateLimitState = useCallback((): RateLimitState => {
    try {
      const stored = localStorage.getItem(getStorageKey(key)); // Use the hook's 'key'
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to parse rate limit state:", error);
    }
    return { attempts: 0, lastAttempt: 0 };
  }, [key]); // 'key' is a dependency for getStorageKey, so it should remain here.

  // Removed 'key' from dependencies for the same reason as getRateLimitState.
  const setRateLimitState = useCallback(
    (state: RateLimitState) => {
      try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(state)); // Use the hook's 'key'
      } catch (error) {
        console.warn("Failed to save rate limit state:", error);
      }
    },
    [key] // 'key' is a dependency for getStorageKey, so it should remain here.
  );

  const checkRateLimit = useCallback((): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime?: number;
    blockedUntil?: number;
  } => {
    const now = Date.now();
    const state = getRateLimitState();

    // Check if currently blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: state.blockedUntil,
      };
    }

    // Reset if window has passed
    if (now - state.lastAttempt > windowMs) {
      const newState: RateLimitState = { attempts: 0, lastAttempt: now }; // Changed let to const
      setRateLimitState(newState);
      return {
        allowed: true,
        remainingAttempts: maxAttempts - 1,
        resetTime: now + windowMs,
      };
    }

    // Check if within limit
    if (state.attempts < maxAttempts) {
      return {
        allowed: true,
        remainingAttempts: maxAttempts - state.attempts - 1,
        resetTime: state.lastAttempt + windowMs,
      };
    }

    // Rate limit exceeded, block user
    const blockedUntil = now + blockDurationMs;
    const newState: RateLimitState = {
      // Changed let to const
      ...state,
      blockedUntil,
      lastAttempt: now,
    };
    setRateLimitState(newState);

    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil,
    };
  }, [
    maxAttempts,
    windowMs,
    blockDurationMs,
    getRateLimitState,
    setRateLimitState,
  ]); // Removed 'key' as it's passed via getStorageKey/setRateLimitState which are memoized

  const recordAttempt = useCallback((): boolean => {
    const now = Date.now();
    const state = getRateLimitState();

    // Don't record if currently blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      return false;
    }

    // Reset if window has passed
    if (now - state.lastAttempt > windowMs) {
      const newState: RateLimitState = { attempts: 1, lastAttempt: now }; // Changed let to const
      setRateLimitState(newState);
      return true;
    }

    // Increment attempts
    const newAttempts = state.attempts + 1;
    const newState: RateLimitState = {
      // Changed let to const
      attempts: newAttempts,
      lastAttempt: now,
    };

    // Block if exceeded limit
    if (newAttempts >= maxAttempts) {
      newState.blockedUntil = now + blockDurationMs;
    }

    setRateLimitState(newState);
    return newAttempts <= maxAttempts;
  }, [
    maxAttempts,
    windowMs,
    blockDurationMs,
    getRateLimitState,
    setRateLimitState,
  ]); // Removed 'key' as it's passed via getStorageKey/setRateLimitState which are memoized

  const resetRateLimit = useCallback(() => {
    localStorage.removeItem(getStorageKey(key)); // Use the hook's 'key'
  }, [key]); // 'key' is a dependency for getStorageKey, so it should remain here.

  return {
    checkRateLimit,
    recordAttempt,
    resetRateLimit,
  };
};
