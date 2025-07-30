"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useToast } from "@/hooks/use-toast";
import { Edit, Search, ExternalLink } from "lucide-react";
import { Database } from "@/integrations/supabase/types"; // Import Database for precise types
import { SeoMetadata, SeoMetadataForm } from "./SeoMetadataForm";

// Define the Topic interface to accurately reflect the final mapped data structure
export interface Topic {
  id: string;
  title: string;
  slug: string;
  view_count: number | null; // <--- CHANGED: Allow null
  reply_count: number | null; // <--- CHANGED: Allow null
  created_at: string | null; // <--- CHANGED: Allow null
  category: {
    // This is the transformed category object
    name: string;
    slug: string;
  };
  // Explicitly allow null for SEO fields based on typical database nullable columns
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
}

// Define the type for the raw data returned by the Supabase query before mapping
type TopicQueryResultRow = Database["public"]["Tables"]["topics"]["Row"] & {
  // This matches the 'categories!inner(name, slug)' part of your select query
  categories: {
    name: string;
    slug: string;
  } | null; // Use '| null' if the join could potentially be null (though 'inner' usually prevents this)
};

export const TopicSeoManager: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [seoData, setSeoData] = useState<SeoMetadata>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Explicitly type the data returned by useQuery
  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ["topics-seo", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("topics")
        .select(
          `
          id, title, slug, view_count, reply_count, created_at,
          meta_title, meta_description, canonical_url,
          meta_keywords, og_title, og_description, og_image,
          categories!inner(name, slug)
          `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      // The data here will be TopicQueryResultRow[]
      const { data, error } = await query;

      if (error) throw error;

      // Map the raw query result to the Topic interface
      return (data as TopicQueryResultRow[]).map((topicItem) => ({
        // Typed topicItem
        id: topicItem.id,
        title: topicItem.title,
        slug: topicItem.slug,
        view_count: topicItem.view_count, // Now correctly number | null
        reply_count: topicItem.reply_count, // Now correctly number | null
        created_at: topicItem.created_at, // Now correctly string | null
        category: {
          name: topicItem.categories?.name || "", // Provide fallback for safety if categories can be null
          slug: topicItem.categories?.slug || "", // Provide fallback for safety
        },
        meta_title: topicItem.meta_title,
        meta_description: topicItem.meta_description,
        canonical_url: topicItem.canonical_url,
        meta_keywords: topicItem.meta_keywords,
        og_title: topicItem.og_title,
        og_description: topicItem.og_description,
        og_image: topicItem.og_image,
      }));
    },
  });

  const updateTopicSeoMutation = useMutation({
    mutationFn: async ({
      topicId,
      seoData,
    }: {
      topicId: string;
      seoData: SeoMetadata;
    }) => {
      // Ensure seoData keys match the database columns for update
      const { error } = await supabase
        .from("topics")
        .update(seoData) // seoData keys should align with 'topics' table columns
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics-seo"] });
      setIsDialogOpen(false);
      setSelectedTopic(null);
      toast({
        title: "SEO Updated",
        description: "Topic SEO metadata has been updated successfully.",
      });
    },
    onError: (error: unknown) => {
      // Type error as unknown
      let errorMessage = "Failed to update SEO metadata.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const openSeoEditor = (topic: Topic) => {
    setSelectedTopic(topic);
    setSeoData({
      meta_title: topic.meta_title,
      meta_description: topic.meta_description,
      canonical_url: topic.canonical_url,
      meta_keywords: topic.meta_keywords,
      og_title: topic.og_title,
      og_description: topic.og_description,
      og_image: topic.og_image,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTopic) return;

    updateTopicSeoMutation.mutate({
      topicId: selectedTopic.id,
      seoData,
    });
  };

  const hasSeoData = (topic: Topic) => {
    return !!(
      topic.meta_title ||
      topic.meta_description ||
      topic.canonical_url ||
      topic.meta_keywords ||
      topic.og_title ||
      topic.og_description ||
      topic.og_image
    );
  };

  const formatDate = (dateString: string | null) => {
    // Allow null for dateString
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <div>Loading topics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Topic SEO Management</h2>
          <p className="text-muted-foreground">
            Manage SEO metadata for forum topics
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {topics?.map((topic) => (
          <Card key={topic.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {topic.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span>
                      /{topic.category.slug}/{topic.slug}
                    </span>
                    <span>•</span>
                    <span>{topic.view_count || 0} views</span>{" "}
                    {/* Add fallback for display */}
                    <span>•</span>
                    <span>{topic.reply_count || 0} replies</span>{" "}
                    {/* Add fallback for display */}
                    <span>•</span>
                    <span>{formatDate(topic.created_at)}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasSeoData(topic) && (
                    <Badge variant="outline" className="gap-1">
                      <Search className="h-3 w-3" />
                      SEO Configured
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSeoEditor(topic)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit SEO
                  </Button>
                </div>
              </div>
            </CardHeader>
            {hasSeoData(topic) && (
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {topic.meta_title && (
                    <div>
                      <span className="font-medium">Meta Title:</span>{" "}
                      {topic.meta_title}
                    </div>
                  )}
                  {topic.meta_description && (
                    <div>
                      <span className="font-medium">Meta Description:</span>{" "}
                      {topic.meta_description}
                    </div>
                  )}
                  {topic.canonical_url && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Canonical URL:</span>
                      <a
                        href={topic.canonical_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {topic.canonical_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SEO Metadata for "{selectedTopic?.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <SeoMetadataForm
              data={seoData}
              onChange={setSeoData}
              title="Topic SEO"
              description="Configure SEO metadata for this topic"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateTopicSeoMutation.isPending}
              >
                {updateTopicSeoMutation.isPending
                  ? "Saving..."
                  : "Save SEO Metadata"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
