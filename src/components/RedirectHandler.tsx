"use client";

import { useEffect } from "react";
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { getRedirectUrl } from "@/lib/utils/urlRedirects";
import { migrateUrl } from "@/lib/utils/urlMigration";

export default function RedirectHandler() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // useParams returns an object where keys are the dynamic segments
    // For a route like /category/[categorySlug]/[topicSlug], params would be { categorySlug: '...', topicSlug: '...' }
    // We need to be careful with how params are structured, as they are strings or string arrays.
    const categorySlug = Array.isArray(params.categorySlug)
      ? params.categorySlug[0]
      : params.categorySlug;
    const subcategorySlug = Array.isArray(params.subcategorySlug)
      ? params.subcategorySlug[0]
      : params.subcategorySlug;
    const topicSlug = Array.isArray(params.topicSlug)
      ? params.topicSlug[0]
      : params.topicSlug;

    // Construct the full current URL path including search params
    const currentPathWithQuery = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    // Check for URL migration first
    const migratedUrl = migrateUrl(currentPathWithQuery);
    if (migratedUrl) {
      router.replace(migratedUrl); // Use router.replace for 301-like redirect
      return;
    }

    // Check if we need to redirect the category slug
    if (categorySlug) {
      const newCategorySlug = getRedirectUrl(categorySlug);
      if (newCategorySlug && newCategorySlug !== categorySlug) {
        // Ensure actual change to avoid infinite loop
        // Build the new URL maintaining the same structure
        let newPath = `/${newCategorySlug}`;

        if (subcategorySlug) {
          const newSubcategorySlug = getRedirectUrl(subcategorySlug);
          newPath += `/${newSubcategorySlug || subcategorySlug}`;

          if (topicSlug) {
            newPath += `/${topicSlug}`;
          }
        } else if (topicSlug) {
          // This case is less likely with nested dynamic routes but kept for safety
          newPath += `/${topicSlug}`;
        }

        router.replace(newPath); // Perform 301 redirect by replacing the current history entry
        return;
      }
    }

    // Check subcategory redirects (this logic might need refinement based on your Next.js route structure)
    // In Next.js App Router, deeply nested dynamic segments are often handled by a single page.tsx
    // e.g., src/app/[categorySlug]/[topicSlug]/page.tsx
    // If subcategorySlug is a separate dynamic segment and not part of a combined slug, this logic applies.
    if (subcategorySlug && !categorySlug) {
      // Only check if subcategory is present and no category (e.g., /old-sub/topic)
      const newSubcategorySlug = getRedirectUrl(subcategorySlug);
      if (newSubcategorySlug && newSubcategorySlug !== subcategorySlug) {
        // Ensure actual change
        let newPath = `/${newSubcategorySlug}`;
        if (topicSlug) {
          newPath += `/${topicSlug}`;
        }
        router.replace(newPath);
        return;
      }
    }
  }, [params, router, pathname, searchParams]);

  return null;
}
