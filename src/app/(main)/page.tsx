// src/app/(main)/page.tsx
// This file is a Server Component by default in Next.js App Router
import { Suspense } from "react";
import { getInitialForumData } from "@/lib/serverDataFetcher";
import { Card } from "@/components/ui/card";

// Import the client component that will handle all rendering and interactivity
import ForumClientComponent from "@/components/forum/Forum";

// Import specific types from your hooks for better type safety
import { PaginatedHotTopicsResult } from "@/hooks/useHotTopics";
import { PaginatedTopicsResult } from "@/hooks/useTopics";
import { Category } from "@/hooks/useCategories"; // Assuming Category is the type for level1Forums etc.
import { ForumSettingsMap, MappedSettingValue } from "@/hooks/useForumSettings"; // Import ForumSettingsMap AND MappedSettingValue

// Define types for the data fetched by getInitialForumData
interface InitialForumData {
  hotTopics: PaginatedHotTopicsResult;
  newTopics: PaginatedTopicsResult;
  topTopics: PaginatedTopicsResult;
  level1Forums: Category[];
  level2Forums: Category[];
  level3Forums: Category[];
  forumSettings: ForumSettingsMap;
}

export default async function ForumPage() {
  let initialData: InitialForumData | null = null;
  let errorFetchingData = false;

  try {
    initialData = await getInitialForumData();
  } catch (error) {
    console.error("Failed to fetch initial forum data on server:", error);
    errorFetchingData = true;
  }

  // Fallback settings for Schema Markup if fetching fails
  // Provide a fallback that matches the structure of ForumSettingsMap
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
      // Add other default settings if needed, matching MappedSettingValue structure
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

  // --- Schema Markup / Rich Snippets ---
  // These are still rendered by the Server Component for SEO benefits
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    // SAFELY ACCESS value: use optional chaining and nullish coalescing
    name:
      (forumSettingsForSchema.forum_name?.value as string) ??
      "Minor Hockey Talks",
    url: "https://www.minorhockeytalks.com", // IMPORTANT: Replace with your actual forum URL
    description:
      (forumSettingsForSchema.forum_description?.value as string) ??
      "A community forum for minor hockey discussions",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.minorhockeytalks.com/search?q={search_term_string}", // IMPORTANT: Replace with your actual search URL
      "query-input": "required name=search_term_string",
    },
  };

  const discussionForumSchema = {
    "@context": "https://schema.org",
    "@type": "DiscussionForum",
    // SAFELY ACCESS value: use optional chaining and nullish coalescing
    name:
      (forumSettingsForSchema.forum_name?.value as string) ??
      "Minor Hockey Talks",
    description:
      (forumSettingsForSchema.forum_description?.value as string) ??
      "A community forum for minor hockey discussions",
    url: "https://www.minorhockeytalks.com", // IMPORTANT: Replace with your actual forum URL
    about: {
      "@type": "Thing",
      name: "Minor Hockey", // Or a more specific topic if your forum is niche
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://www.minorhockeytalks.com", // IMPORTANT: Replace with your actual forum URL
    },
  };

  if (errorFetchingData) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading initial forum content. Please try again later.
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Schema Markup for WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {/* Schema Markup for DiscussionForum */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(discussionForumSchema),
        }}
      />

      {/* Client Component for all rendering and interactivity */}
      {/* It receives the initial data fetched on the server for hydration */}
      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading forum content...</div>
          </Card>
        }
      >
        <ForumClientComponent
          initialHotTopics={initialData?.hotTopics}
          initialNewTopics={initialData?.newTopics}
          initialTopTopics={initialData?.topTopics}
          initialLevel1Forums={initialData?.level1Forums}
          initialLevel2Forums={initialData?.level2Forums}
          initialLevel3Forums={initialData?.level3Forums}
          initialForumSettings={initialData?.forumSettings}
        />
      </Suspense>
    </>
  );
}
