// src/app/(main)/category/[categorySlug]/[topicSlug]/page.tsx
import { Metadata } from "next";
import {
  getInitialTopicData,
  getInitialCategoryData, // Assuming this is used for metadata fallback
} from "@/lib/serverDataFetcher"; // Import the server data fetcher
import { TopicView } from "@/components/forum/TopicView";
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { generateCategoryUrl } from "@/lib/utils/urlHelpers"; // Assuming this utility exists

// Define the shape of the resolved parameters for clarity
interface ResolvedTopicRouteParams {
  categorySlug: string;
  subcategorySlug?: string; // Optional for hierarchical categories
  topicSlug: string;
}

// Define the shape of the resolved search parameters
interface ResolvedSearchParams {
  page?: string;
}

// Update TopicPageProps to use Promises, as expected by the generated type file.
// This resolves the type compatibility issue with the .next/types definitions
// for both the page component and generateMetadata's arguments.
export interface TopicPageProps {
  params: Promise<ResolvedTopicRouteParams>; // params is a Promise for the type checker
  searchParams: Promise<ResolvedSearchParams>; // searchParams is a Promise for the type checker
}

// Metadata generation for SEO
// FIXED: Type the argument as TopicPageProps to satisfy the generated type file.
// Then, await 'params' internally as it's typed as a Promise.
export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  // Await params to get the resolved object for actual use.
  const resolvedParams = await params;
  const { categorySlug, subcategorySlug, topicSlug } = resolvedParams;

  let topicTitle = "Topic Not Found";
  let topicDescription = "Discussion forum topic.";
  let canonicalUrl = "";

  try {
    // Fetch initial topic data on the server for metadata
    const initialData = await getInitialTopicData({
      categorySlug,
      subcategorySlug,
      topicSlug,
      page: 1, // Metadata typically doesn't depend on page, so fetch first page
      limit: 1, // Only need minimal data for metadata
    });

    if (initialData?.topic) {
      topicTitle = initialData.topic.title;
      topicDescription = initialData.topic.content
        ? initialData.topic.content.substring(0, 160) + "..."
        : "A discussion topic.";
      canonicalUrl = initialData.topic.canonical_url || ""; // Use canonical_url from topic
    } else {
      // Fallback if topic not found, try to get category for better metadata
      const categoryData = await getInitialCategoryData(
        categorySlug, // Pass categorySlug directly
        1, // page
        1, // limit
        subcategorySlug // Pass subcategorySlug if getInitialCategoryData can handle it
      );
      if (categoryData?.category) {
        topicTitle = `Discussion in ${categoryData.category.name}`;
        topicDescription =
          categoryData.category.description ||
          "Browse topics in this category.";

        canonicalUrl = generateCategoryUrl({
          slug: categoryData.category.slug,
          parent_category_id:
            categoryData.category.parent_category_id ?? undefined,
        });
      }
    }
  } catch (error) {
    console.error("Error generating metadata for topic:", error);
    // Metadata will default to "Topic Not Found"
  }

  return {
    title: topicTitle,
    description: topicDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: topicTitle,
      description: topicDescription,
      url: canonicalUrl,
      type: "article",
      // You can add an image if your topic data includes one
      // images: initialData.topic?.og_image ? [initialData.topic.og_image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: topicTitle,
      description: topicDescription,
      // You can add an image if your topic data includes one
      // images: initialData.topic?.og_image ? [initialData.topic.og_image] : [],
    },
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: TopicPageProps) {
  // Await params and searchParams here to get their resolved values.
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { categorySlug, subcategorySlug, topicSlug } = resolvedParams;
  const currentPage = parseInt(resolvedSearchParams.page || "1", 10);

  const queryClient = new QueryClient();

  let initialData;
  let errorOccurred = false;

  try {
    // Fetch initial data on the server
    initialData = await getInitialTopicData({
      categorySlug,
      subcategorySlug,
      topicSlug,
      page: currentPage,
      limit: 20, // Match postsPerPage in TopicView
    });

    // Prefetch posts for the current topic
    if (initialData?.topic?.id) {
      await queryClient.prefetchQuery({
        queryKey: ["posts", initialData.topic.id, currentPage, 20],
        queryFn: async () => {
          // This should ideally call the same logic as usePosts directly
          // or a server-side equivalent that fetches paginated posts.
          return initialData.posts;
        },
      });
    }
  } catch (error) {
    console.error("Failed to fetch initial topic data on server:", error);
    errorOccurred = true;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TopicView
        initialTopic={initialData?.topic || null}
        initialPosts={initialData?.posts || null}
        initialForumSettings={initialData?.forumSettings || null}
        categorySlug={categorySlug}
        topicSlug={topicSlug}
        currentPage={currentPage}
        errorOccurred={errorOccurred} // Pass error state
      />
    </HydrationBoundary>
  );
}
