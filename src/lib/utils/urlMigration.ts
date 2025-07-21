"use client";

import { getRedirectUrl } from "./urlRedirects";

// Migration utility to handle URL structure changes
export const migrateUrl = (path: string): string | null => {
  // Remove leading slash for processing
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const segments = cleanPath.split("/");

  // Handle flat Level 3 category URLs that need to become hierarchical
  if (segments.length === 1) {
    const categorySlug = segments[0];

    // Check if this is a redirectable category (from urlRedirects)
    const newSlug = getRedirectUrl(categorySlug);
    if (newSlug) {
      // This was already handled by the redirect system
      return null;
    }

    // Check if this looks like a Level 3 category (contains region/year patterns)
    if (
      categorySlug.includes("-201") ||
      categorySlug.includes("-200") ||
      categorySlug.match(/-aaa$/i) ||
      categorySlug.match(/-aa$/i) ||
      categorySlug.match(/-a$/i) ||
      categorySlug.match(/-rep$/i)
    ) {
      // This might be a Level 3 category that should be hierarchical
      // For now, we'll let the existing redirect system handle this
      // In the future, we could add more sophisticated migration logic here
      return null;
    }
  }

  // No migration needed
  return null;
};

export const shouldMigrateUrl = (path: string): boolean => {
  return migrateUrl(path) !== null;
};
