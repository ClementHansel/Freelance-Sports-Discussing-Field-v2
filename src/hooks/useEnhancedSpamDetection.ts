"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserIPWithFallback } from "@/lib/utils/ipUtils";

interface SpamCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  confidence?: number;
  indicators?: Record<string, any>;
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
  }, []);

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
          };
        }

        // First check if IP is banned
        const { data: ipCheck, error: ipError } = await supabase.rpc(
          "check_ip_banned",
          {
            user_ip: userIP,
          }
        );

        if (ipError) {
          console.error("IP ban check failed:", ipError);
          // Continue with unlimited posting if IP check fails
        } else if (ipCheck) {
          const result = ipCheck as {
            is_banned: boolean;
            ban_type?: string;
            expires_at?: string;
            reason?: string;
          };

          if (result.is_banned) {
            const banType = result.ban_type;
            const expires = result.expires_at;

            let message = `Your IP address has been ${
              banType === "permanent" ? "permanently " : ""
            }blocked: ${result.reason}`;
            if (banType === "temporary" && expires) {
              const expiryDate = new Date(expires);
              message += ` (expires: ${expiryDate.toLocaleDateString()})`;
            }

            return {
              allowed: banType === "shadowban", // Allow shadowbanned users to post but flag for review
              reason: "ip_banned",
              message,
              blockExpiresAt: expires,
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
    [generateFingerprint]
  );

  const analyzeContent = useCallback(
    async (
      content: string,
      contentType: "post" | "topic" = "post"
    ): Promise<SpamCheckResult> => {
      try {
        const { data, error } = await supabase.rpc("analyze_content_for_spam", {
          content_text: content,
          content_type: contentType,
        });

        if (error) {
          console.error("Content analysis failed:", error);
          return {
            allowed: true, // Fail open - don't block if analysis fails
          };
        }

        const result = data as {
          is_spam: boolean;
          confidence: number;
          indicators: Record<string, any>;
        };

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
    []
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
    [generateFingerprint]
  );

  const reportSpam = useCallback(
    async (
      contentType: "post" | "topic",
      contentId: string,
      reason: string,
      reporterId?: string
    ): Promise<boolean> => {
      try {
        const userIP = await getUserIPWithFallback();

        const { error } = await supabase.from("spam_reports").insert({
          content_type: contentType,
          content_id: contentId,
          reporter_id: reporterId || null,
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
    []
  );

  return {
    checkRateLimit,
    analyzeContent,
    recordActivity,
    reportSpam,
    isChecking,
  };
};
