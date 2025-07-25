"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/react";
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
    try {
      Sentry.setTag("page", "redirect_handler");
      Sentry.setContext("redirectParams", {
        params,
        pathname,
        search: searchParams.toString(),
      });

      const categorySlug = Array.isArray(params.categorySlug)
        ? params.categorySlug[0]
        : params.categorySlug;
      const subcategorySlug = Array.isArray(params.subcategorySlug)
        ? params.subcategorySlug[0]
        : params.subcategorySlug;
      const topicSlug = Array.isArray(params.topicSlug)
        ? params.topicSlug[0]
        : params.topicSlug;

      const currentPathWithQuery = `${pathname}${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      const migratedUrl = migrateUrl(currentPathWithQuery);
      if (migratedUrl) {
        Sentry.addBreadcrumb({
          category: "navigation",
          message: `Migrating URL to ${migratedUrl}`,
          level: "info",
        });
        router.replace(migratedUrl);
        return;
      }

      if (categorySlug) {
        const newCategorySlug = getRedirectUrl(categorySlug);
        if (newCategorySlug && newCategorySlug !== categorySlug) {
          let newPath = `/${newCategorySlug}`;

          if (subcategorySlug) {
            const newSubcategorySlug = getRedirectUrl(subcategorySlug);
            newPath += `/${newSubcategorySlug || subcategorySlug}`;

            if (topicSlug) {
              newPath += `/${topicSlug}`;
            }
          } else if (topicSlug) {
            newPath += `/${topicSlug}`;
          }

          Sentry.addBreadcrumb({
            category: "redirect",
            message: `Redirecting category from ${categorySlug} to ${newPath}`,
            level: "info",
          });
          router.replace(newPath);
          return;
        }
      }

      if (subcategorySlug && !categorySlug) {
        const newSubcategorySlug = getRedirectUrl(subcategorySlug);
        if (newSubcategorySlug && newSubcategorySlug !== subcategorySlug) {
          let newPath = `/${newSubcategorySlug}`;
          if (topicSlug) {
            newPath += `/${topicSlug}`;
          }

          Sentry.addBreadcrumb({
            category: "redirect",
            message: `Redirecting subcategory from ${subcategorySlug} to ${newPath}`,
            level: "info",
          });
          router.replace(newPath);
          return;
        }
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error("Redirect handler failed:", error);
    }
  }, [params, router, pathname, searchParams]);

  return null;
}
