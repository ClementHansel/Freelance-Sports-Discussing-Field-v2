"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForumSettings } from "@/hooks/useForumSettings";
import { useToast } from "@/hooks/use-toast";
import { Save, Home } from "lucide-react";

// Define the shape of your SEO data state
interface SeoDataState {
  title: string;
  description: string;
  keywords: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

export const HomePageSeoManager: React.FC = () => {
  const { getSetting, updateSetting, isUpdating, settings, isLoading } =
    useForumSettings();
  const { toast } = useToast();
  const [isDirty, setIsDirty] = useState(false);

  // Initialize seoData with empty strings.
  // The useEffect will populate it with actual settings once loaded.
  const [seoData, setSeoData] = useState<SeoDataState>({
    title: "",
    description: "",
    keywords: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image: "",
  });

  React.useEffect(() => {
    if (!isLoading && settings) {
      setSeoData({
        // Cast the return of getSetting to string, as we expect these to be strings
        title: getSetting("seo_home_title", "") as string,
        description: getSetting("seo_home_description", "") as string,
        keywords: getSetting("seo_home_keywords", "") as string,
        canonical_url: getSetting("seo_home_canonical_url", "") as string,
        og_title: getSetting("seo_home_og_title", "") as string,
        og_description: getSetting("seo_home_og_description", "") as string,
        og_image: getSetting("seo_home_og_image", "") as string,
      });
    }
  }, [isLoading, settings, getSetting]); // Added getSetting to dependencies

  const handleChange = (field: keyof SeoDataState, value: string) => {
    // Typed field
    setSeoData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const settingsToUpdate = [
        {
          key: "seo_home_title",
          value: seoData.title,
          description: "Home page meta title",
        },
        {
          key: "seo_home_description",
          value: seoData.description,
          description: "Home page meta description",
        },
        {
          key: "seo_home_keywords",
          value: seoData.keywords,
          description: "Home page meta keywords",
        },
        {
          key: "seo_home_canonical_url",
          value: seoData.canonical_url,
          description: "Home page canonical URL",
        },
        {
          key: "seo_home_og_title",
          value: seoData.og_title,
          description: "Home page Open Graph title",
        },
        {
          key: "seo_home_og_description",
          value: seoData.og_description,
          description: "Home page Open Graph description",
        },
        {
          key: "seo_home_og_image",
          value: seoData.og_image,
          description: "Home page Open Graph image",
        },
      ];

      for (const setting of settingsToUpdate) {
        // Renamed 'settings' to 'settingsToUpdate' to avoid conflict
        await updateSetting({
          key: setting.key,
          value: setting.value, // Value is already typed as string
          type: "string",
          category: "seo",
          description: setting.description,
        });
      }

      setIsDirty(false);
      toast({
        title: "Home Page SEO Updated",
        description: "SEO metadata has been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to update SEO metadata:", error); // Log the error for debugging
      toast({
        title: "Error",
        description: "Failed to update SEO metadata.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <div>
            <CardTitle>Home Page SEO</CardTitle>
            <CardDescription>
              Configure SEO metadata for your forum home page
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic SEO */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Basic SEO</h4>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meta Title</Label>
              <Input
                id="title"
                placeholder="Minor Hockey Talks - The Premier Community"
                value={seoData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 50-60 characters. Current: {seoData.title.length}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Meta Description</Label>
              <Textarea
                id="description"
                placeholder="Join the leading online community for minor hockey players, parents, and coaches..."
                value={seoData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 150-160 characters. Current:{" "}
                {seoData.description.length}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Meta Keywords</Label>
              <Input
                id="keywords"
                placeholder="minor hockey, youth hockey, hockey community, hockey discussion"
                value={seoData.keywords}
                onChange={(e) => handleChange("keywords", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated keywords (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input
                id="canonical_url"
                placeholder="https://yourdomain.com/"
                value={seoData.canonical_url}
                onChange={(e) => handleChange("canonical_url", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Preferred URL for your home page
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
                placeholder="Minor Hockey Talks - Premier Hockey Community"
                value={seoData.og_title}
                onChange={(e) => handleChange("og_title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_description">OG Description</Label>
              <Textarea
                id="og_description"
                placeholder="Join thousands of hockey families in our community..."
                value={seoData.og_description}
                onChange={(e) => handleChange("og_description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image">OG Image URL</Label>
              <Input
                id="og_image"
                placeholder="https://yourdomain.com/og-image.jpg"
                value={seoData.og_image}
                onChange={(e) => handleChange("og_image", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Image for social media sharing (1200x630px recommended)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isUpdating || !isDirty}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
