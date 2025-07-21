"use client";

import React, { Suspense } from "react"; // Import Suspense
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ChevronRight } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCategoryStats } from "@/hooks/useCategoryStats";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Define a specific interface for Category based on its usage in this file
interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  color: string | null; // Allow null as per your usage
  description?: string | null; // Allow null
  region?: string | null; // Allow null
  birth_year?: string | null; // Allow null
  play_level?: string | null; // Allow null
  parent_category_id?: string | null; // For grouping logic
}

// Define the interface for the grouped forum structure
interface ForumGroup {
  name: string;
  forums: CategoryItem[];
}

const CategoryCard = ({ category }: { category: CategoryItem }) => {
  // Applied CategoryItem type
  const { data: stats } = useCategoryStats(category.id);

  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color ?? "" }} // Added nullish coalescing
            />
            <h3 className="font-semibold text-foreground">{category.name}</h3>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            {category.region && <span>Region: {category.region}</span>}
            {category.birth_year && (
              <span>Birth Year: {category.birth_year}</span>
            )}
            {category.play_level && <span>Level: {category.play_level}</span>}
          </div>
          <Badge variant="secondary" className="text-xs">
            {stats?.topic_count || 0} topics
          </Badge>
        </div>
      </Card>
    </Link>
  );
};

// Changed to default export for Next.js page files
export default function CategoriesSlug() {
  // Explicitly type the data returned from useCategories
  const { data: level1Categories, isLoading: isLoadingLevel1 } = useCategories(
    null,
    1
  ) as {
    data: CategoryItem[] | undefined;
    isLoading: boolean; // Add isLoading for better UX
  };
  const { data: level2Categories, isLoading: isLoadingLevel2 } = useCategories(
    undefined,
    2
  ) as {
    data: CategoryItem[] | undefined;
    isLoading: boolean; // Add isLoading for better UX
  };
  const { data: level3Categories, isLoading: isLoadingLevel3 } = useCategories(
    undefined,
    3
  ) as {
    data: CategoryItem[] | undefined;
    isLoading: boolean; // Add isLoading for better UX
  };

  // Determine overall loading state
  const overallLoading = isLoadingLevel1 || isLoadingLevel2 || isLoadingLevel3;

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>All Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Categories</h1>
        <p className="text-muted-foreground">
          Browse all forum categories and discussions
        </p>
      </div>

      {/* Wrap the main content with Suspense */}
      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading categories...</div>
          </Card>
        }
      >
        {overallLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 h-32 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {/* Main Forums */}
            {level1Categories && level1Categories.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Main Forums
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {level1Categories.map(
                    (
                      category: CategoryItem // Applied CategoryItem type
                    ) => (
                      <CategoryCard key={category.id} category={category} />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Province/State Forums */}
            {level2Categories && level2Categories.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Province & State Forums
                </h2>
                <div className="space-y-6">
                  {(() => {
                    // Explicitly type the `countries` array
                    const countries: ForumGroup[] = [];

                    // IMPORTANT: Replace these placeholder UUIDs with the actual IDs from your Supabase 'categories' table
                    // for your "Canada" and "USA" parent categories.
                    const CANADA_PARENT_CATEGORY_ID =
                      "YOUR_CANADA_PARENT_CATEGORY_UUID_HERE";
                    const USA_PARENT_CATEGORY_ID =
                      "YOUR_USA_PARENT_CATEGORY_UUID_HERE";
                    const TOURNAMENT_PARENT_CATEGORY_ID =
                      "44444444-4444-4444-4444-444444444444"; // Assuming this is correct
                    const GENERAL_DISCUSSION_PARENT_CATEGORY_ID =
                      "33333333-3333-3333-3333-333333333333"; // Assuming this is correct
                    const IMPORTANT_PARENT_CATEGORY_ID =
                      "234392cf-f9a4-4371-bba4-18a16d449f9f"; // Assuming this is correct

                    const canadianForums = level2Categories
                      .filter(
                        (category) =>
                          category.parent_category_id ===
                          CANADA_PARENT_CATEGORY_ID
                      )
                      .sort((a, b) =>
                        (a.region || "").localeCompare(b.region || "")
                      );

                    const usaForums = level2Categories
                      .filter(
                        (category) =>
                          category.parent_category_id === USA_PARENT_CATEGORY_ID
                      )
                      .sort((a, b) =>
                        (a.region || "").localeCompare(b.region || "")
                      );

                    const tournamentForums = level2Categories
                      .filter(
                        (category) =>
                          category.parent_category_id ===
                          TOURNAMENT_PARENT_CATEGORY_ID
                      )
                      .sort((a, b) =>
                        (a.name || "").localeCompare(b.name || "")
                      );

                    const generalForums = level2Categories
                      .filter(
                        (category) =>
                          category.parent_category_id ===
                          GENERAL_DISCUSSION_PARENT_CATEGORY_ID
                      )
                      .sort((a, b) =>
                        (a.name || "").localeCompare(b.name || "")
                      );

                    const importantForums = level2Categories
                      .filter(
                        (category) =>
                          category.parent_category_id ===
                          IMPORTANT_PARENT_CATEGORY_ID
                      )
                      .sort((a, b) =>
                        (a.name || "").localeCompare(b.name || "")
                      );

                    // Push objects with the defined ForumGroup interface
                    if (canadianForums.length > 0) {
                      countries.push({
                        name: "Canada",
                        forums: canadianForums,
                      });
                    }
                    if (usaForums.length > 0) {
                      countries.push({ name: "USA", forums: usaForums });
                    }
                    if (tournamentForums.length > 0) {
                      countries.push({
                        name: "Tournaments",
                        forums: tournamentForums,
                      });
                    }
                    if (generalForums.length > 0) {
                      countries.push({
                        name: "General Discussion",
                        forums: generalForums,
                      });
                    }
                    if (importantForums.length > 0) {
                      countries.push({
                        name: "Important",
                        forums: importantForums,
                      });
                    }

                    return countries.map((country) => (
                      <div key={country.name} className="space-y-3">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                          {country.name}
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {country.forums.map(
                            (
                              category: CategoryItem // Applied CategoryItem type
                            ) => (
                              <CategoryCard
                                key={category.id}
                                category={category}
                              />
                            )
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Age Group & Skill Level Categories */}
            {level3Categories && level3Categories.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Age Group & Skill Level Categories
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {level3Categories.map(
                    (
                      category: CategoryItem // Applied CategoryItem type
                    ) => (
                      <CategoryCard key={category.id} category={category} />
                    )
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Suspense>
    </div>
  );
}
