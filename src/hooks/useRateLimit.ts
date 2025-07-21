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

  const getStorageKey = (key: string) => `rate_limit_${key}`;

  const getRateLimitState = useCallback((): RateLimitState => {
    try {
      const stored = localStorage.getItem(getStorageKey(key));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to parse rate limit state:", error);
    }
    return { attempts: 0, lastAttempt: 0 };
  }, [key]);

  const setRateLimitState = useCallback(
    (state: RateLimitState) => {
      try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(state));
      } catch (error) {
        console.warn("Failed to save rate limit state:", error);
      }
    },
    [key]
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
      const newState = { attempts: 0, lastAttempt: now };
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
    const newState = {
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
    key,
    maxAttempts,
    windowMs,
    blockDurationMs,
    getRateLimitState,
    setRateLimitState,
  ]);

  const recordAttempt = useCallback((): boolean => {
    const now = Date.now();
    const state = getRateLimitState();

    // Don't record if currently blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      return false;
    }

    // Reset if window has passed
    if (now - state.lastAttempt > windowMs) {
      const newState = { attempts: 1, lastAttempt: now };
      setRateLimitState(newState);
      return true;
    }

    // Increment attempts
    const newAttempts = state.attempts + 1;
    let newState: RateLimitState = {
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
    key,
    maxAttempts,
    windowMs,
    blockDurationMs,
    getRateLimitState,
    setRateLimitState,
  ]);

  const resetRateLimit = useCallback(() => {
    localStorage.removeItem(getStorageKey(key));
  }, [key]);

  return {
    checkRateLimit,
    recordAttempt,
    resetRateLimit,
  };
};
