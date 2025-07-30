// src/app/(main)/category/[categorySlug]/page.tsx
import { Suspense } from "react";
import { getInitialCategoryData } from "@/lib/serverDataFetcher"; // Import the new data fetcher
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation"; // For handling cases where category is not found

// Import the client component that will handle all rendering and interactivity
import CategoryClientComponent from "@/components/forum/category/Category";

// Import specific types from your hooks for better type safety
import { PaginatedTopicsResult } from "@/hooks/useTopics";
import { Category } from "@/hooks/useCategories";
import { CategoryWithActivity } from "@/hooks/useCategoriesByActivity"; // IMPORTED: CategoryWithActivity
import { ForumSettingsMap } from "@/hooks/useForumSettings";
import { Metadata } from "next"; // Import Metadata type for generateMetadata
import { generateCategoryUrl } from "@/lib/utils/urlHelpers"; // Assuming this utility exists

// Define the shape of the resolved parameters for clarity
interface ResolvedCategoryRouteParams {
  categorySlug: string;
  // If your route can also have a subcategory slug (e.g., /category/[categorySlug]/[subcategorySlug]),
  // you might need to include it here as well, depending on your route setup.
  // subcategorySlug?: string;
}

// Define the shape of the resolved search parameters
interface ResolvedSearchParams {
  page?: string;
  sort?: string; // Assuming you have a sort parameter
}

// Define props for the page component, including params
// FIXED: params and searchParams are now Promises to satisfy Next.js generated types.
export interface CategoryPageProps {
  params: Promise<ResolvedCategoryRouteParams>;
  searchParams: Promise<ResolvedSearchParams>;
}

// Define types for the data fetched by getInitialCategoryData
interface InitialCategoryData {
  category: Category | null;
  topics: PaginatedTopicsResult | null;
  subcategories: CategoryWithActivity[] | null; // CHANGED: Now expects CategoryWithActivity[]
  forumSettings: ForumSettingsMap | null;
}

// Metadata generation for SEO
// FIXED: Type the argument as CategoryPageProps to satisfy the generated type file.
// Then, await 'params' internally as it's typed as a Promise.
export async function generateMetadata({
  params,
  searchParams, // Include searchParams in metadata args if needed for dynamic titles/descriptions
}: CategoryPageProps): Promise<Metadata> {
  // Await params and searchParams to get the resolved objects for actual use.
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { categorySlug } = resolvedParams;
  const page = Number(resolvedSearchParams.page) || 1; // Use resolved searchParams
  const limit = 1; // Only need minimal data for metadata

  let categoryTitle = "Category Not Found";
  let categoryDescription = "Discussion forum category.";
  let canonicalUrl = "";

  try {
    const initialData = await getInitialCategoryData(categorySlug, page, limit);

    if (initialData?.category) {
      categoryTitle = initialData.category.name;
      categoryDescription =
        initialData.category.description || "Browse topics in this category.";
      // Use generateCategoryUrl for consistent URL generation
      canonicalUrl = generateCategoryUrl({
        slug: initialData.category.slug,
        parent_category_id:
          initialData.category.parent_category_id ?? undefined,
      });
    }
  } catch (error) {
    console.error("Error generating metadata for category:", error);
  }

  return {
    title: categoryTitle,
    description: categoryDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: categoryTitle,
      description: categoryDescription,
      url: canonicalUrl,
      type: "website", // Or 'CollectionPage' if more specific schema is applied
    },
    twitter: {
      card: "summary_large_image",
      title: categoryTitle,
      description: categoryDescription,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  // FIXED: Await params and searchParams here to get their resolved values.
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { categorySlug } = resolvedParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 10; // Or whatever your default limit is

  let initialData: InitialCategoryData | null = null;
  let errorFetchingData = false;

  try {
    initialData = await getInitialCategoryData(categorySlug, page, limit);

    // If category is not found, return a 404
    if (!initialData.category) {
      notFound();
    }
  } catch (error) {
    console.error("Failed to fetch initial category data on server:", error);
    errorFetchingData = true;
    // We can still try to render the client component with null data,
    // and let client-side hooks handle re-fetching or error display.
    // Or, for critical errors, show a server-side error message.
  }

  // Fallback settings for Schema Markup if fetching fails or is null
  const forumSettingsForSchema: ForumSettingsMap =
    initialData?.forumSettings || {
      forum_name: {
        value: "Minor Hockey Talks",
        type: "string",
        category: "general",
        description: null,
        isPublic: true,
      },
      forum_description: {
        value: "A community forum for minor hockey discussions",
        type: "string",
        category: "general",
        description: null,
        isPublic: true,
      },
      social_facebook: {
        value: "",
        type: "string",
        category: "social",
        description: null,
        isPublic: true,
      },
      social_twitter: {
        value: "",
        type: "string",
        category: "social",
        description: null,
        isPublic: true,
      },
      social_instagram: {
        value: "",
        type: "string",
        category: "social",
        description: null,
        isPublic: true,
      },
      social_youtube: {
        value: "",
        type: "string",
        category: "social",
        description: null,
        isPublic: true,
      },
    };

  const currentCategory = initialData?.category;

  // --- Schema Markup / Rich Snippets ---
  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.yourforumurl.com", // IMPORTANT: Replace with your actual home URL
      },
      currentCategory &&
        currentCategory.level === 1 && {
          "@type": "ListItem",
          position: 2,
          name: currentCategory.name,
          item: `https://www.yourforumurl.com/category/${currentCategory.slug}`, // IMPORTANT: Replace
        },
      currentCategory &&
        currentCategory.level === 2 && {
          "@type": "ListItem",
          position: 2,
          name:
            initialData?.subcategories?.find(
              // Use initialData.subcategories (now CategoryWithActivity)
              (cat) => cat.id === currentCategory.parent_category_id
            )?.name || "Parent Category",
          item: `https://www.yourforumurl.com/category/${
            initialData?.subcategories?.find(
              // Use initialData.subcategories
              (cat) => cat.id === currentCategory.parent_category_id
            )?.slug || ""
          }`, // IMPORTANT: Replace
        },
      currentCategory &&
        currentCategory.level === 2 && {
          "@type": "ListItem",
          position: 3,
          name: currentCategory.name,
          item: `https://www.yourforumurl.com/category/${currentCategory.slug}`, // IMPORTANT: Replace
        },
      currentCategory &&
        currentCategory.level === 3 && {
          "@type": "ListItem",
          position: 2,
          name:
            initialData?.subcategories?.find(
              // Use initialData.subcategories
              (cat) =>
                cat.id ===
                initialData?.subcategories?.find(
                  // Use initialData.subcategories
                  (c) => c.id === currentCategory.parent_category_id
                )?.parent_category_id
            )?.name || "Grandparent Category",
          item: `https://www.yourforumurl.com/category/${
            initialData?.subcategories?.find(
              // Use initialData.subcategories
              (cat) =>
                cat.id ===
                initialData?.subcategories?.find(
                  // Use initialData.subcategories
                  (c) => c.id === currentCategory.parent_category_id
                )?.parent_category_id
            )?.slug || ""
          }`, // IMPORTANT: Replace
        },
      currentCategory &&
        currentCategory.level === 3 && {
          "@type": "ListItem",
          position: 3,
          name:
            initialData?.subcategories?.find(
              // Use initialData.subcategories
              (c) => c.id === currentCategory.parent_category_id
            )?.name || "Parent Category",
          item: `https://www.yourforumurl.com/category/${
            initialData?.subcategories?.find(
              // Use initialData.subcategories
              (c) => c.id === currentCategory.parent_category_id
            )?.slug || ""
          }`, // IMPORTANT: Replace
        },
      currentCategory &&
        currentCategory.level === 3 && {
          "@type": "ListItem",
          position: 4,
          name: currentCategory.name,
          item: `https://www.yourforumurl.com/category/${currentCategory.slug}`, // IMPORTANT: Replace
        },
    ].filter(Boolean), // Filter out null/undefined entries
  };

  // CollectionPage Schema (for the category page itself)
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: currentCategory?.name || forumSettingsForSchema.forum_name?.value,
    description:
      currentCategory?.description ||
      forumSettingsForSchema.forum_description?.value,
    url: `https://www.yourforumurl.com/category/${categorySlug}`, // IMPORTANT: Replace
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.yourforumurl.com/category/${categorySlug}`, // IMPORTANT: Replace
    },
    // You can add more properties like 'about', 'keywords' based on your category content
  };

  if (errorFetchingData) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading initial category content. Please try again later.
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Schema Markup for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Schema Markup for CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageSchema),
        }}
      />

      {/* Client Component for all rendering and interactivity */}
      {/* It receives the initial data fetched on the server for hydration */}
      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading category content...</div>
          </Card>
        }
      >
        <CategoryClientComponent
          initialCategory={initialData?.category || undefined}
          initialTopics={initialData?.topics || undefined}
          initialSubcategories={initialData?.subcategories || undefined} // This is now CategoryWithActivity[]
          initialForumSettings={initialData?.forumSettings || undefined}
          // Pass the current categorySlug and page for client-side re-fetching if needed
          categorySlug={categorySlug}
          currentPage={page}
        />
      </Suspense>
    </>
  );
}
