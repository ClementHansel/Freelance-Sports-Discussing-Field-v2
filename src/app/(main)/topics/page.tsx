// src/app/(main)/topics/page.tsx
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import Topics from "@/components/forum/topics/Topics";
import { getInitialTopicsPageData } from "@/lib/serverDataFetcher"; // Import the new server data fetcher
import { Metadata } from "next"; // Import Metadata type
import { captureException } from "@sentry/nextjs"; // Import Sentry

// Define the allowed sort options for topics
type TopicSortBy = "created_at" | "view_count" | "reply_count" | "hot_score";

// Define the shape of the resolved search parameters for clarity
interface ResolvedTopicsSearchParams {
  page?: string;
  sort?: TopicSortBy;
  // Add other search parameters if your Topics component uses them for filtering/sorting
}

// Define props for the page component, which will receive searchParams
export interface TopicsPageProps {
  // For top-level pages without dynamic segments, params is an empty object but typed as a Promise.
  // FIXED: Added ESLint disable comment for no-empty-object-type as this is expected by Next.js generated types.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  params: Promise<{}>;
  searchParams: Promise<ResolvedTopicsSearchParams>; // Use Promise for type compatibility
}

// Generate dynamic metadata for the topics page
export async function generateMetadata({
  searchParams,
}: TopicsPageProps): Promise<Metadata> {
  // Await searchParams to get the resolved object for actual use.
  const resolvedSearchParams = await searchParams;

  const page = Number(resolvedSearchParams.page) || 1;
  const sort: TopicSortBy = resolvedSearchParams.sort || "created_at"; // Default sort

  let title = "All Forum Topics";
  let description = "Browse all discussions and topics on our forum.";
  let canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/topics`;

  try {
    if (sort === "hot_score") {
      title = "Hot Topics - Forum Discussions";
      description =
        "Discover the hottest and most popular discussions on our forum.";
    } else if (sort === "view_count") {
      title = "Top Topics - Forum Discussions";
      description = "See the most viewed and replied topics on our forum.";
    } else if (sort === "reply_count") {
      title = "Most Replied Topics - Forum Discussions";
      description = "See the topics with the most replies on our forum.";
    }

    if (page > 1) {
      title += ` (Page ${page})`;
      canonicalUrl += `?page=${page}`;
      if (sort !== "created_at") {
        canonicalUrl += `&sort=${sort}`;
      }
    } else if (sort !== "created_at") {
      canonicalUrl += `?sort=${sort}`;
    }
  } catch (error) {
    console.error("Error generating metadata for topics page:", error);
    captureException(error, {
      level: "error",
      tags: { source: "generate_metadata_topics_page" },
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
      // Add more Open Graph properties if available
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      // Add Twitter specific properties
    },
  };
}

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  // Await searchParams here to get their resolved values.
  const resolvedSearchParams = await searchParams;

  const page = Number(resolvedSearchParams.page) || 1;
  const sort: TopicSortBy = resolvedSearchParams.sort || "created_at"; // Default to 'created_at'
  const ascending = sort === "created_at" ? false : false; // Newest first for 'created_at', otherwise descending for 'hot/top'

  let initialData;
  let errorOccurred = false;

  try {
    initialData = await getInitialTopicsPageData(page, 10, sort, ascending); // Pass sort with correct type
  } catch (error) {
    console.error("Failed to fetch initial topics page data:", error);
    captureException(error, {
      level: "error",
      tags: { source: "topics_page_initial_data_fetch" },
      extra: { page, sort, ascending },
    });
    errorOccurred = true;
    // Provide fallback data structure in case of error
    initialData = {
      topics: { data: [], totalCount: 0, totalPages: 0, currentPage: page },
      forumSettings: {},
    };
  }

  // Schema Markup (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage", // Or WebPage, depending on specific content
    name: "All Forum Topics",
    description: "Browse all discussions and topics on our forum.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/topics`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: initialData.topics.data
        .slice(0, 10)
        .map((topic, index) => ({
          // Limit to first 10 for schema
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "DiscussionForumPosting",
            headline: topic.title,
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/category/${topic.categories?.slug}/${topic.slug}`,
            datePublished: topic.created_at,
            author: {
              "@type": "Person",
              name: topic.profiles?.username || "Anonymous",
            },
            interactionStatistic: [
              {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/ViewAction",
                userInteractionCount: topic.view_count,
              },
              {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/CommentAction",
                userInteractionCount: topic.reply_count,
              },
            ],
          },
        })),
    },
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
            <div className="text-center">Loading topics...</div>
          </Card>
        }
      >
        <Topics
          initialTopics={initialData.topics}
          initialForumSettings={initialData.forumSettings}
          currentPage={page}
          sortBy={sort}
          errorOccurred={errorOccurred} // Pass error state
        />
      </Suspense>
    </>
  );
}
