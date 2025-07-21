"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface SeoMetadata {
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

interface SeoMetadataFormProps {
  data: SeoMetadata;
  onChange: (data: SeoMetadata) => void;
  title?: string;
  description?: string;
}

export const SeoMetadataForm: React.FC<SeoMetadataFormProps> = ({
  data,
  onChange,
  title = "SEO Metadata",
  description = "Configure SEO metadata for better search engine optimization",
}) => {
  const handleChange = (field: keyof SeoMetadata, value: string) => {
    onChange({
      ...data,
      [field]: value || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic SEO */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Basic SEO</h4>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                placeholder="Custom page title for search engines"
                value={data.meta_title || ""}
                onChange={(e) => handleChange("meta_title", e.target.value)}
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 50-60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                placeholder="Brief description for search engine results"
                value={data.meta_description || ""}
                onChange={(e) =>
                  handleChange("meta_description", e.target.value)
                }
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 150-160 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                placeholder="comma, separated, keywords"
                value={data.meta_keywords || ""}
                onChange={(e) => handleChange("meta_keywords", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated keywords (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input
                id="canonical_url"
                placeholder="https://example.com/page"
                value={data.canonical_url || ""}
                onChange={(e) => handleChange("canonical_url", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Preferred URL for this content
              </p>
            </div>
          </div>
        </div>

        {/* Open Graph */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Open Graph (Social Media)</h4>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="og_title">OG Title</Label>
              <Input
                id="og_title"
                placeholder="Title for social media sharing"
                value={data.og_title || ""}
                onChange={(e) => handleChange("og_title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_description">OG Description</Label>
              <Textarea
                id="og_description"
                placeholder="Description for social media sharing"
                value={data.og_description || ""}
                onChange={(e) => handleChange("og_description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image">OG Image URL</Label>
              <Input
                id="og_image"
                placeholder="https://example.com/image.jpg"
                value={data.og_image || ""}
                onChange={(e) => handleChange("og_image", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Image for social media sharing (1200x630px recommended)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
