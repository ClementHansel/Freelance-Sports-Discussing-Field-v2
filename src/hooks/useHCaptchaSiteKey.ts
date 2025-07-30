// src\hooks\useHCaptchaSiteKey.ts
"use client";

import { useForumSettings } from "./useForumSettings";

export const useHCaptchaSiteKey = () => {
  const { getSetting, isLoading } = useForumSettings();

  // Get the hCaptcha site key from forum settings, fallback to test key.
  // Use nullish coalescing operator (??) to ensure siteKey is always a string.
  // If getSetting returns undefined, it will fall back to the default test key.
  let siteKey: string = getSetting(
    "hcaptcha_site_key",
    "10000000-ffff-ffff-ffff-000000000001",
  ) ?? "10000000-ffff-ffff-ffff-000000000001"; // Added ?? fallback

  // Handle case where value might be a quoted string from JSON storage
  if (
    typeof siteKey === "string" &&
    siteKey.startsWith('"') &&
    siteKey.endsWith('"')
  ) {
    siteKey = siteKey.slice(1, -1); // Remove quotes
  }

  console.log(
    "hCaptcha site key retrieved:",
    siteKey,
    "isTestKey:",
    siteKey === "10000000-ffff-ffff-ffff-000000000001",
  );

  return {
    siteKey,
    isLoading,
    isTestKey: siteKey === "10000000-ffff-ffff-ffff-000000000001",
  };
};
