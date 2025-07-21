"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MessageSquare,
  User,
  Clock,
  FileText,
  FolderOpen,
} from "lucide-react";
import { useSearch, SearchFilter, SearchResult } from "@/hooks/useSearch";
import { formatDistanceToNow } from "date-fns";

// Define a comprehensive LocalSearchResult interface that aligns with the properties
// you are actually using from the SearchResult returned by useSearch.
// Properties like 'url', 'snippet', 'author' are derived or assumed, not directly from SearchResult.
interface LocalSearchResult {
  id: string;
  type: "topic" | "post" | "user" | "category";
  title: string;
  content: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  slug?: string | null;
  author_username?: string | null; // Assuming this is the property for author
  created_at: string | null;
  reply_count?: number | null;
  view_count?: number | null;
  category_color?: string | null;
}

export default function SearchPageComponent() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.search);
    setQuery(currentSearchParams.get("q") || "");
    setFilter((currentSearchParams.get("filter") as SearchFilter) || "all");
    setSearchTerm(currentSearchParams.get("q") || "");
    setIsClient(true);
  }, []);

  // Removed the third argument (isClient && !!query) from useSearch.
  // The useSearch hook itself should handle the 'enabled' logic internally.
  const {
    data: searchResults = [],
    isLoading,
    error,
  } = useSearch(query, filter); // FIX: Removed third argument

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set("q", searchTerm);
      if (filter !== "all") {
        params.set("filter", filter);
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleFilterChange = (newFilter: SearchFilter) => {
    setFilter(newFilter);
    if (query) {
      const params = new URLSearchParams();
      params.set("q", query);
      if (newFilter !== "all") {
        params.set("filter", newFilter);
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  const getPlaceholderText = () => {
    switch (filter) {
      case "categories":
        return "Search categories...";
      case "topics":
        return "Search topics...";
      case "posts":
        return "Search posts...";
      default:
        return "Search topics, posts, and categories...";
    }
  };

  const getFilteredResultsText = () => {
    if (!query || isLoading) return "";

    const count = searchResults.length;
    const filterText = filter === "all" ? "" : ` ${filter}`;
    return `(${count}${filterText} results found)`;
  };

  const truncateContent = (content: string | null, maxLength: number = 150) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  if (!isClient) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading search page...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        {query && (
          <p className="text-muted-foreground">
            Showing results for "{query}" {getFilteredResultsText()}
          </p>
        )}
      </div>

      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading search interface...</div>
          </Card>
        }
      >
        {/* Search Form */}
        <Card className="p-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={getPlaceholderText()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="categories">Categories</SelectItem>
                    <SelectItem value="topics">Topics</SelectItem>
                    <SelectItem value="posts">Posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </Card>

        {/* Search Results */}
        {query && (
          <Card className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Search Error</h3>
                <p className="text-muted-foreground mb-4">
                  There was an error performing your search. Please try again.
                </p>
                <Button onClick={() => router.refresh()}>Retry</Button>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result: LocalSearchResult) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {result.type === "post" ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : result.type === "category" ? (
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {result.type === "post"
                              ? "Post"
                              : result.type === "category"
                              ? "Category"
                              : "Topic"}
                          </Badge>
                        </div>
                        <Link
                          href={
                            result.type === "category"
                              ? `/category/${result.category_slug || result.id}`
                              : result.category_slug && result.slug
                              ? `/category/${result.category_slug}/${result.slug}`
                              : `/topic/${result.id}`
                          }
                          className="font-medium text-foreground hover:text-primary text-lg"
                        >
                          {result.title}
                        </Link>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {truncateContent(result.content)}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          {result.type !== "category" &&
                            result.author_username && (
                              <span>by {result.author_username}</span>
                            )}
                          {result.category_name && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                color: result.category_color ?? undefined,
                              }}
                            >
                              {result.category_name}
                            </Badge>
                          )}
                          {result.type === "topic" && (
                            <>
                              {result.reply_count !== undefined &&
                                result.reply_count !== null && (
                                  <div className="flex items-center space-x-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{result.reply_count} replies</span>
                                  </div>
                                )}
                              {result.view_count !== undefined &&
                                result.view_count !== null && (
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{result.view_count} views</span>
                                  </div>
                                )}
                            </>
                          )}
                          {result.created_at && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(result.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or browse our categories
                </p>
                <Button asChild>
                  <Link href="/">Browse Forum</Link>
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* No Search Query */}
        {!query && (
          <Card className="p-6 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Search the Forum</h3>
            <p className="text-muted-foreground mb-4">
              Enter your search terms above to find topics, posts, and
              discussions
            </p>
            <Button asChild>
              <Link href="/">Back to Forum</Link>
            </Button>
          </Card>
        )}
      </Suspense>
    </div>
  );
}
