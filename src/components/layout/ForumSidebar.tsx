"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useTopicsLegacy as useTopics,
  Topic as UseTopicsTopic,
} from "@/hooks/useTopicsLegacy"; // Import Topic type from useTopicsLegacy
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const ForumSidebar = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const maxItems = 100;

  // Ensure the data type is explicitly defined as an array of UseTopicsTopic
  const { data: allTopics, isLoading } = useTopics() as {
    data: UseTopicsTopic[] | undefined;
    isLoading: boolean;
  };

  // Get paginated topics
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTopics =
    allTopics?.slice(startIndex, Math.min(endIndex, maxItems)) || [];

  // Calculate total pages (max 10 pages for 100 items)
  const totalPages = Math.min(
    Math.ceil((allTopics?.length || 0) / itemsPerPage),
    Math.ceil(maxItems / itemsPerPage)
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Most Recent Topics */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-900">Most Recent</h3>
          <span className="text-xs text-gray-500">
            {currentPage} of {totalPages}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedTopics.map(
                (
                  topic: UseTopicsTopic // Explicitly type topic here
                ) => (
                  <div
                    key={topic.id}
                    className="border-b last:border-b-0 pb-3 last:pb-0"
                  >
                    {/* Next.js Link component for navigation */}
                    <Link
                      href={
                        topic.slug && topic.categories?.slug
                          ? `/category/${topic.categories.slug}/${topic.slug}`
                          : `/topic/${topic.id}`
                      }
                      className="block"
                    >
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 hover:text-blue-600 mb-2 line-clamp-2">
                        {topic.title}
                      </h4>
                    </Link>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          // FIX: Use nullish coalescing to provide empty string fallback for color
                          borderColor: topic.categories?.color ?? "",
                          color: topic.categories?.color ?? "",
                        }}
                      >
                        {topic.categories?.name}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {/* FIX: Provide empty string fallback for new Date() if created_at is null */}
                        {formatDistanceToNow(new Date(topic.created_at || ""))}{" "}
                        ago
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>

                <span className="text-xs text-gray-500">
                  Page {currentPage}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
