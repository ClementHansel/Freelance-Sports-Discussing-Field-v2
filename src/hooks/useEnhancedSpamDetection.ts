"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserIPWithFallback } from "@/lib/utils/ipUtils";
import { Json } from "@/integrations/supabase/types"; // Import Json type

// Define the expected result from the 'check_ip_banned' RPC
interface IpBanCheckResult {
  is_banned: boolean;
  ban_type?: string | null; // e.g., "permanent", "temporary", "shadowban"
  expires_at?: string | null; // ISO string
  reason?: string | null;
}

// Define the expected result from the 'analyze_content_for_spam' RPC
interface ContentAnalysisResult {
  is_spam: boolean;
  confidence: number;
  indicators: Record<string, Json>; // Use Json for dynamic object values
}

interface SpamCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  confidence?: number;
  indicators?: Record<string, Json>;
  retryAfter?: number;
  blockExpiresAt?: string;
}

interface RateLimitInfo {
  remainingPostsHour?: number;
  remainingPostsDay?: number;
  remainingTopicsDay?: number;
}

export const useEnhancedSpamDetection = () => {
  const [isChecking, setIsChecking] = useState(false);

  // Generate browser fingerprint for additional tracking
  const generateFingerprint = useCallback((): string => {
    // Ensure window and document are defined for client-side APIs
    if (typeof window === "undefined" || typeof document === "undefined") {
      return "server-side-fingerprint"; // Return a fallback for server-side rendering
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Browser fingerprint", 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 0,
    ].join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }, []); // No dependencies needed for generateFingerprint as it uses global browser APIs

  const checkRateLimit = useCallback(
    async (
      sessionId: string,
      contentType: "post" | "topic" = "post"
    ): Promise<SpamCheckResult & RateLimitInfo> => {
      setIsChecking(true);

      try {
        const userIP = await getUserIPWithFallback();
        const fingerprint = generateFingerprint();

        if (!userIP) {
          return {
            allowed: false,
            reason: "ip_detection_failed",
            message: "Unable to verify your connection. Please try again.",
            remainingPostsHour: 0, // Default for RateLimitInfo when not allowed
            remainingPostsDay: 0,
            remainingTopicsDay: 0,
          };
        }

        // First check if IP is banned
        const { data: ipCheckRaw, error: ipError } = await supabase.rpc(
          "check_ip_banned",
          {
            user_ip: userIP,
          }
        );

        if (ipError) {
          console.error("IP ban check failed:", ipError);
          // Continue with unlimited posting if IP check fails
        } else if (ipCheckRaw) {
          const ipCheck = ipCheckRaw as unknown as IpBanCheckResult; // Cast to specific interface

          if (ipCheck.is_banned) {
            const banType = ipCheck.ban_type;
            const expires = ipCheck.expires_at;

            let message = `Your IP address has been ${
              banType === "permanent" ? "permanently " : ""
            }blocked: ${ipCheck.reason || "No reason provided"}`; // Add fallback for reason
            if (banType === "temporary" && expires) {
              const expiryDate = new Date(expires);
              message += ` (expires: ${expiryDate.toLocaleDateString()})`;
            }

            return {
              allowed: banType === "shadowban", // Allow shadowbanned users to post but flag for review
              reason: "ip_banned",
              message,
              blockExpiresAt: expires || undefined, // Ensure undefined if null
              remainingPostsHour: 0, // Default for RateLimitInfo when not allowed
              remainingPostsDay: 0,
              remainingTopicsDay: 0,
            };
          }
        }

        // POSTING LIMITS REMOVED - Always allow posting
        return {
          allowed: true,
          remainingPostsHour: 999999,
          remainingPostsDay: 999999,
          remainingTopicsDay: 999999,
        };
      } catch (error) {
        console.error("Error checking rate limit:", error);
        // Allow posting even if check fails
        return {
          allowed: true,
          remainingPostsHour: 999999,
          remainingPostsDay: 999999,
          remainingTopicsDay: 999999,
        };
      } finally {
        setIsChecking(false);
      }
    },
    [generateFingerprint] // generateFingerprint is a stable useCallback, so this is fine
  );

  const analyzeContent = useCallback(
    async (
      content: string,
      contentType: "post" | "topic" = "post"
    ): Promise<SpamCheckResult> => {
      try {
        const { data: analysisDataRaw, error } = await supabase.rpc(
          "analyze_content_for_spam",
          {
            content_text: content,
            content_type: contentType,
          }
        );

        if (error) {
          console.error("Content analysis failed:", error);
          return {
            allowed: true, // Fail open - don't block if analysis fails
          };
        }

        const result = analysisDataRaw as unknown as ContentAnalysisResult; // Cast to specific interface

        return {
          allowed: !result.is_spam,
          reason: result.is_spam ? "spam_detected" : undefined,
          message: result.is_spam
            ? `Content flagged as spam (${Math.round(
                result.confidence * 100
              )}% confidence). Please revise your message.`
            : undefined,
          confidence: result.confidence,
          indicators: result.indicators,
        };
      } catch (error) {
        console.error("Error analyzing content:", error);
        return { allowed: true }; // Fail open
      }
    },
    [] // No dependencies needed for analyzeContent as it uses supabase and arguments
  );

  const recordActivity = useCallback(
    async (
      sessionId: string,
      contentType: "post" | "topic" = "post"
    ): Promise<void> => {
      try {
        const userIP = await getUserIPWithFallback();
        const fingerprint = generateFingerprint();

        if (!userIP) return;

        await supabase.rpc("record_enhanced_anonymous_activity", {
          user_ip: userIP,
          p_session_id: sessionId,
          p_fingerprint_hash: fingerprint,
          p_content_type: contentType,
        });
      } catch (error) {
        console.error("Error recording activity:", error);
        // Don't throw - this shouldn't block posting
      }
    },
    [generateFingerprint] // generateFingerprint is a stable useCallback, so this is fine
  );

  const reportSpam = useCallback(
    async (
      contentType: "post" | "topic",
      contentId: string,
      reason: string,
      reporterId?: string | null // Allow reporterId to be null
    ): Promise<boolean> => {
      try {
        const userIP = await getUserIPWithFallback();

        const { error } = await supabase.from("spam_reports").insert({
          content_type: contentType,
          content_id: contentId,
          reporter_id: reporterId || null, // Ensure null if undefined
          reporter_ip: userIP,
          report_reason: reason,
          automated_detection: false,
        });

        if (error) {
          console.error("Error reporting spam:", error);
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error reporting spam:", error);
        return false;
      }
    },
    [] // No dependencies needed for reportSpam as it uses supabase and arguments
  );

  return {
    checkRateLimit,
    analyzeContent,
    recordActivity,
    reportSpam,
    isChecking,
  };
};
