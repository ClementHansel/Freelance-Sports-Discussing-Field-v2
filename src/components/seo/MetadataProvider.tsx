"use client";

import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useForumSettings } from "@/hooks/useForumSettings";
import { useAuth } from "@/hooks/useAuth";

interface PageMetadata {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  canonical?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  // Add other meta tags as needed
}

interface MetadataContextType {
  setPageMetadata: (metadata: PageMetadata) => void;
}

const MetadataContext = createContext<MetadataContextType | null>(null);

export const useMetadata = () => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error("useMetadata must be used within MetadataProvider");
  }
  return context;
};

interface MetadataProviderProps {
  children: ReactNode;
}

export const MetadataProvider: React.FC<MetadataProviderProps> = ({
  children,
}) => {
  const pathname = usePathname(); // Next.js pathname
  const params = useParams(); // Next.js params
  const searchParams = useSearchParams(); // Next.js searchParams
  const { getSetting } = useForumSettings();
  const { user } = useAuth();
  const [customMetadata, setCustomMetadata] = React.useState<PageMetadata>({});

  // Helper to extract string from params (which can be string | string[] | undefined)
  const getParamString = (param: string | string[] | undefined) =>
    Array.isArray(param) ? param[0] : param;

  const categorySlug = getParamString(params.categorySlug);
  const subcategorySlug = getParamString(params.subcategorySlug);
  const topicSlug = getParamString(params.topicSlug);

  // Get category metadata if on category page
  const { data: categoryMetadata } = useQuery({
    queryKey: ["category-metadata", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return null;

      const { data, error } = await supabase
        .from("categories")
        .select(
          "name, meta_title, meta_description, meta_keywords, canonical_url, og_title, og_description, og_image"
        )
        .eq("slug", categorySlug)
        .single();

      if (error) {
        console.error("Error fetching category metadata:", error);
        return null;
      }
      return data;
    },
    enabled: !!categorySlug,
  });

  // Get topic metadata if on topic page - using same logic as useTopicByPath
  const { data: topicMetadata } = useQuery({
    queryKey: ["topic-metadata", categorySlug, subcategorySlug, topicSlug],
    queryFn: async () => {
      console.log("MetadataProvider: Fetching topic metadata for:", {
        categorySlug,
        subcategorySlug,
        topicSlug,
      });

      if (!topicSlug || !categorySlug) return null;

      // Get category ID first - handle hierarchical structure like useTopicByPath
      let categoryData;
      let categoryError;

      if (subcategorySlug) {
        // Hierarchical: validate parent-child relationship
        const { data: parentCategory, error: parentError } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();

        if (parentError) {
          console.error(
            "MetadataProvider: Error fetching parent category:",
            parentError
          );
          return null;
        }

        const { data: childCategory, error: childError } = await supabase
          .from("categories")
          .select("id, parent_category_id")
          .eq("slug", subcategorySlug)
          .eq("parent_category_id", parentCategory.id)
          .single();

        categoryData = childCategory;
        categoryError = childError;
      } else {
        // Single category
        const { data, error } = await supabase
          .from("categories")
          .select("id, parent_category_id")
          .eq("slug", categorySlug)
          .single();

        categoryData = data;
        categoryError = error;
      }

      if (categoryError) {
        console.error(
          "MetadataProvider: Error fetching category:",
          categoryError
        );
        return null;
      }

      // Get topic by slug and category
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select(
          "meta_title, meta_description, meta_keywords, canonical_url, og_title, og_description, og_image, title, content"
        )
        .eq("slug", topicSlug)
        .eq("category_id", categoryData.id)
        .single();

      if (topicError) {
        console.error("MetadataProvider: Error fetching topic:", topicError);
        return null;
      }

      console.log(
        "MetadataProvider: Successfully fetched topic metadata:",
        topicData
      );
      return topicData;
    },
    enabled: !!categorySlug && !!topicSlug,
  });

  const setPageMetadata = (metadata: PageMetadata) => {
    setCustomMetadata(metadata);
  };

  // Get user profile data for profile page
  const { data: profileData } = useQuery({
    queryKey: ["profile-metadata", user?.id],
    queryFn: async () => {
      if (!user?.id || pathname !== "/profile") return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!user?.id && pathname === "/profile",
  });

  // Determine page metadata based on current route
  const getPageMetadata = (): PageMetadata => {
    const baseTitle = getSetting("forum_name", "Minor Hockey Talks");
    const baseSeparator = " - ";

    // Custom metadata takes highest priority
    if (Object.keys(customMetadata).length > 0) {
      return {
        title: customMetadata.title
          ? `${customMetadata.title}${baseSeparator}${baseTitle}`
          : undefined,
        ...customMetadata,
      };
    }

    // Topic page metadata
    if (topicMetadata && topicSlug) {
      return {
        title:
          topicMetadata.meta_title ||
          `${topicMetadata.title}${baseSeparator}${baseTitle}`,
        description:
          topicMetadata.meta_description ||
          (topicMetadata.content
            ? topicMetadata.content.substring(0, 160)
            : undefined),
        keywords: topicMetadata.meta_keywords,
        canonical: topicMetadata.canonical_url,
        ogTitle: topicMetadata.og_title || topicMetadata.title,
        ogDescription:
          topicMetadata.og_description || topicMetadata.meta_description,
        ogImage: topicMetadata.og_image,
      };
    }

    // Category page metadata
    if (categoryMetadata && categorySlug) {
      return {
        title:
          categoryMetadata.meta_title ||
          `${
            categoryMetadata.name || categorySlug
          }${baseSeparator}${baseTitle}`,
        description: categoryMetadata.meta_description,
        keywords: categoryMetadata.meta_keywords,
        canonical: categoryMetadata.canonical_url,
        ogTitle: categoryMetadata.og_title,
        ogDescription: categoryMetadata.og_description,
        ogImage: categoryMetadata.og_image,
      };
    }

    // Dynamic route-based titles
    const path = pathname; // Use Next.js pathname
    const searchQuery = searchParams.get("q");

    // Home page
    if (path === "/") {
      return {
        title: getSetting("seo_home_title", baseTitle),
        description: getSetting(
          "seo_home_description",
          "Join the leading online community for minor hockey players, parents, and coaches."
        ),
        keywords: getSetting(
          "seo_home_keywords",
          "minor hockey, youth hockey, hockey community"
        ),
        canonical: getSetting("seo_home_canonical_url", ""),
        ogTitle: getSetting("seo_home_og_title", ""),
        ogDescription: getSetting("seo_home_og_description", ""),
        ogImage: getSetting("seo_home_og_image", ""),
      };
    }

    // Search page
    if (path === "/search") {
      const title = searchQuery
        ? `Search results for "${searchQuery}"${baseSeparator}${baseTitle}`
        : `Search${baseSeparator}${baseTitle}`;
      return {
        title,
        description: searchQuery
          ? `Search results for "${searchQuery}" on ${baseTitle}`
          : `Search topics and discussions on ${baseTitle}`,
      };
    }

    // Profile page
    if (path === "/profile") {
      const username = profileData?.username || "User";
      return {
        title: `${username}'s Profile${baseSeparator}${baseTitle}`,
        description: `View ${username}'s profile, posts, and activity on ${baseTitle}`,
      };
    }

    // Admin pages
    if (path.startsWith("/admin")) {
      const adminSection = path.split("/")[2];
      const sectionTitles: Record<string, string> = {
        users: "User Management",
        content: "Content Management",
        moderation: "Moderation",
        spam: "Spam Management",
        seo: "SEO Settings",
        settings: "Settings",
      };

      const sectionTitle = adminSection
        ? sectionTitles[adminSection] || "Dashboard"
        : "Dashboard";
      return {
        title: `Admin ${sectionTitle}${baseSeparator}${baseTitle}`,
        description: `Admin panel - ${sectionTitle} for ${baseTitle}`,
      };
    }

    // Static pages with comprehensive coverage
    const routeTitles: Record<string, { title: string; description: string }> =
      {
        "/topics": {
          title: `All Topics${baseSeparator}${baseTitle}`,
          description: `Browse all topics and discussions on ${baseTitle}`,
        },
        "/categories": {
          title: `Categories${baseSeparator}${baseTitle}`,
          description: `Browse all discussion categories on ${baseTitle}`,
        },
        "/settings": {
          title: `Account Settings${baseSeparator}${baseTitle}`,
          description: `Manage your account settings and preferences on ${baseTitle}`,
        },
        "/login": {
          title: `Login${baseSeparator}${baseTitle}`,
          description: `Sign in to your ${baseTitle} account`,
        },
        "/register": {
          title: `Register${baseSeparator}${baseTitle}`,
          description: `Create a new account on ${baseTitle}`,
        },
        "/create": {
          title: `Create Topic${baseSeparator}${baseTitle}`,
          description: `Start a new discussion on ${baseTitle}`,
        },
        "/terms": {
          title: `Terms of Service${baseSeparator}${baseTitle}`,
          description: `Terms of service and user agreement for ${baseTitle}`,
        },
        "/privacy": {
          title: `Privacy Policy${baseSeparator}${baseTitle}`,
          description: `Privacy policy and data protection information for ${baseTitle}`,
        },
        "/blog": {
          title: `Blog${baseSeparator}${baseTitle}`,
          description: `Latest news and updates from ${baseTitle}`,
        },
      };

    // Check for exact route match
    if (routeTitles[path]) {
      return routeTitles[path];
    }

    // Default fallback
    return {
      title: baseTitle,
      description:
        "Join the leading online community for minor hockey players, parents, and coaches.",
    };
  };

  const metadata = getPageMetadata();

  // Effect to update document head
  useEffect(() => {
    // Update document title
    document.title =
      metadata.title || getSetting("forum_name", "Minor Hockey Talks");

    // Helper to create or update meta tags
    const updateMetaTag = (
      name: string,
      content: string | undefined | null,
      isProperty = false
    ) => {
      const selector = isProperty
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let tag = document.head.querySelector(selector) as HTMLMetaElement;

      if (content) {
        if (!tag) {
          tag = document.createElement("meta");
          if (isProperty) {
            tag.setAttribute("property", name);
          } else {
            tag.setAttribute("name", name);
          }
          document.head.appendChild(tag);
        }
        tag.setAttribute("content", content);
      } else if (tag) {
        // Remove tag if content is null or undefined
        document.head.removeChild(tag);
      }
    };

    // Update description and keywords
    updateMetaTag("description", metadata.description);
    updateMetaTag("keywords", metadata.keywords);

    // Update canonical link
    let canonicalLink = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (metadata.canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", metadata.canonical);
    } else if (canonicalLink) {
      document.head.removeChild(canonicalLink);
    }

    // Update Open Graph tags
    updateMetaTag("og:title", metadata.ogTitle, true);
    updateMetaTag("og:description", metadata.ogDescription, true);
    updateMetaTag("og:image", metadata.ogImage, true);
    updateMetaTag("og:type", "website", true); // Assuming type is always website for now

    // Update Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image"); // Assuming this is constant
    updateMetaTag("twitter:title", metadata.ogTitle); // Often same as og:title
    updateMetaTag("twitter:description", metadata.ogDescription); // Often same as og:description
    updateMetaTag("twitter:image", metadata.ogImage); // Often same as og:image
  }, [metadata, getSetting]); // Re-run when metadata or getSetting changes

  return (
    <MetadataContext.Provider value={{ setPageMetadata }}>
      {children}
    </MetadataContext.Provider>
  );
};
