// src/app/(main)/categories/page.tsx
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import Categories from "@/components/forum/categories/Categories"; // Renamed from CategoriesSlug
import { getInitialCategoriesPageData } from "@/lib/serverDataFetcher"; // Import the new server data fetcher
import { Metadata } from "next"; // Import Metadata type
import { captureException } from "@sentry/nextjs"; // Import Sentry

// Generate dynamic metadata for the categories page
export async function generateMetadata(): Promise<Metadata> {
  const title = "All Forum Categories"; // Changed to const
  const description =
    "Explore all discussion categories on our forum, from main forums to regional and skill-based groups."; // Changed to const
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/categories`;

  try {
    // You could fetch some data here to make metadata dynamic,
    // but for a general categories page, static is often sufficient.
  } catch (error) {
    console.error("Error generating metadata for categories page:", error);
    captureException(error, {
      level: "error",
      tags: { source: "generate_metadata_categories_page" },
    });
  }

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: title,
      description: description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
  };
}

export default async function CategoriesPage() {
  let initialData;
  let errorOccurred = false;

  try {
    initialData = await getInitialCategoriesPageData();
  } catch (error) {
    console.error("Failed to fetch initial categories page data:", error);
    captureException(error, {
      level: "error",
      tags: { source: "categories_page_initial_data_fetch" },
    });
    errorOccurred = true;
    // Provide fallback data structure in case of error
    initialData = {
      level1Categories: [],
      level2Categories: [],
      level3Categories: [],
    };
  }

  // Schema Markup (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage", // Or WebPage
    name: "All Forum Categories",
    description: "Explore all discussion categories on our forum.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/categories`,
  };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading categories...</div>
          </Card>
        }
      >
        <Categories
          initialLevel1Categories={initialData.level1Categories}
          initialLevel2Categories={initialData.level2Categories}
          initialLevel3Categories={initialData.level3Categories}
          errorOccurred={errorOccurred} // Pass error state
        />
      </Suspense>
    </>
  );
}
