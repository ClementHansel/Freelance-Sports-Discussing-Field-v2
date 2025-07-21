"use client";

// Utility functions for anonymous posting
export const generateSessionId = (): string => {
  // Generate a unique session ID for anonymous users
  let sessionId = localStorage.getItem("anonymous_session_id");
  if (!sessionId) {
    sessionId =
      "anon_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
    localStorage.setItem("anonymous_session_id", sessionId);
  }
  return sessionId;
};

export const validateAnonymousContent = (
  content: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for common image formats
  if (content.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)/i)) {
    errors.push("Images are not allowed in anonymous posts");
  }

  // Check for URLs (http/https)
  if (content.match(/https?:\/\/[^\s]+/i)) {
    errors.push("Links are not allowed in anonymous posts");
  }

  // Check for markdown image syntax
  if (content.match(/!\[.*\]\(.*\)/)) {
    errors.push("Image markdown is not allowed in anonymous posts");
  }

  // Check for markdown link syntax
  if (content.match(/\[.*\]\(.*\)/)) {
    errors.push("Link markdown is not allowed in anonymous posts");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getClientIP = async (): Promise<string> => {
  try {
    // Try to get real IP from external service
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "127.0.0.1";
  } catch (error) {
    console.warn("Failed to get real IP, using fallback");
    // Fallback: use a combination of user agent and timestamp for uniqueness
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    const hash = btoa(`${userAgent}-${timestamp}`).slice(0, 15);
    return `192.168.1.${hash.slice(-3).replace(/[^0-9]/g, "1")}`;
  }
};
