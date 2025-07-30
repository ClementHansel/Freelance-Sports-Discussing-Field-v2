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

import { useToast } from "@/hooks/use-toast";
import { Edit, Search } from "lucide-react";
import { SeoMetadata, SeoMetadataForm } from "./SeoMetadataForm";

interface Category {
  id: string;
  name: string;
  slug: string;
  level: number;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

export const CategorySeoManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [seoData, setSeoData] = useState<SeoMetadata>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-seo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(
          `
          id, name, slug, level,
          meta_title, meta_description, canonical_url,
          meta_keywords, og_title, og_description, og_image
        `
        )
        .in("level", [1, 2, 3])
        .order("level")
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
  });

  const updateCategorySeoMutation = useMutation({
    mutationFn: async ({
      categoryId,
      seoData,
    }: {
      categoryId: string;
      seoData: SeoMetadata;
    }) => {
      const { error } = await supabase
        .from("categories")
        .update(seoData)
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-seo"] });
      setIsDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: "SEO Updated",
        description: "Category SEO metadata has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update SEO metadata.",
        variant: "destructive",
      });
    },
  });

  const openSeoEditor = (category: Category) => {
    setSelectedCategory(category);
    setSeoData({
      meta_title: category.meta_title,
      meta_description: category.meta_description,
      canonical_url: category.canonical_url,
      meta_keywords: category.meta_keywords,
      og_title: category.og_title,
      og_description: category.og_description,
      og_image: category.og_image,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedCategory) return;

    updateCategorySeoMutation.mutate({
      categoryId: selectedCategory.id,
      seoData,
    });
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Level 1";
      case 2:
        return "Level 2";
      case 3:
        return "Level 3";
      default:
        return `Level ${level}`;
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-green-100 text-green-800";
      case 3:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const hasSeoData = (category: Category) => {
    return !!(
      category.meta_title ||
      category.meta_description ||
      category.canonical_url
    );
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category SEO Management</h2>
          <p className="text-muted-foreground">
            Manage SEO metadata for categories (levels 1, 2, and 3)
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getLevelColor(category.level)}>
                    {getLevelLabel(category.level)}
                  </Badge>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>/{category.slug}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasSeoData(category) && (
                    <Badge variant="outline" className="gap-1">
                      <Search className="h-3 w-3" />
                      SEO Configured
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSeoEditor(category)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit SEO
                  </Button>
                </div>
              </div>
            </CardHeader>
            {hasSeoData(category) && (
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {category.meta_title && (
                    <div>
                      <span className="font-medium">Meta Title:</span>{" "}
                      {category.meta_title}
                    </div>
                  )}
                  {category.meta_description && (
                    <div>
                      <span className="font-medium">Meta Description:</span>{" "}
                      {category.meta_description}
                    </div>
                  )}
                  {category.canonical_url && (
                    <div>
                      <span className="font-medium">Canonical URL:</span>{" "}
                      {category.canonical_url}
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
            <DialogTitle>
              SEO Metadata for "{selectedCategory?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <SeoMetadataForm
              data={seoData}
              onChange={setSeoData}
              title="Category SEO"
              description="Configure SEO metadata for this category"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateCategorySeoMutation.isPending}
              >
                {updateCategorySeoMutation.isPending
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
