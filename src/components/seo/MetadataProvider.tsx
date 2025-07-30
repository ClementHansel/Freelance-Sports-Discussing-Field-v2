// src\components\seo\MetadataProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
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

  // Define setPageMetadata function here
  const setPageMetadata = useCallback((metadata: PageMetadata) => {
    setCustomMetadata((prev) => ({ ...prev, ...metadata }));
  }, []); // No dependencies needed as it only sets state

  // FIXED: Added null as the second argument (defaultValue) to getSetting
  const defaultTitle = getSetting("site_name", null) as string | null;
  // FIXED: Added null as the second argument (defaultValue) to getSetting
  const defaultDescription = getSetting("site_description", null) as
    | string
    | null;

  const currentPath =
    typeof window !== "undefined" ? `${window.location.origin}${pathname}` : "";

  const updateMetaTag = (
    name: string,
    content: string | null | undefined,
    isOg?: boolean
  ) => {
    const selector = isOg ? `meta[property='${name}']` : `meta[name='${name}']`;
    let tag = document.head.querySelector(selector) as HTMLMetaElement;
    if (content) {
      if (!tag) {
        tag = document.createElement("meta");
        if (isOg) {
          tag.setAttribute("property", name);
        } else {
          tag.setAttribute("name", name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    } else if (tag) {
      document.head.removeChild(tag);
    }
  };

  const getTopicMetadata = (
    topicId: string | undefined
  ): PageMetadata | undefined => {
    // This is a placeholder. In a real application, you'd fetch topic details here.
    // For now, let's return some dummy data or null.
    return undefined;
  };

  const getPostMetadata = (
    postId: string | undefined
  ): PageMetadata | undefined => {
    // Placeholder for fetching post-specific metadata
    return undefined;
  };

  const getCategoryMetadata = (
    categorySlug: string | undefined
  ): PageMetadata | undefined => {
    // Placeholder for fetching category-specific metadata
    return undefined;
  };

  const getSubcategoryMetadata = (
    categorySlug: string | undefined,
    subcategorySlug: string | undefined
  ): PageMetadata | undefined => {
    // Placeholder for fetching subcategory-specific metadata
    return undefined;
  };

  useEffect(() => {
    let metadata: PageMetadata = {};
    const categorySlug = params.categorySlug as string | undefined;
    const subcategorySlug = params.subcategorySlug as string | undefined;
    const topicSlug = params.topicSlug as string | undefined;
    const topicId = params.topicId as string | undefined;
    const postId = params.postId as string | undefined;

    if (topicId) {
      metadata = getTopicMetadata(topicId) || {};
    } else if (topicSlug && categorySlug) {
      metadata = getTopicMetadata(topicSlug) || {}; // Assuming getTopicMetadata can also handle slug
    } else if (subcategorySlug && categorySlug) {
      metadata = getSubcategoryMetadata(categorySlug, subcategorySlug) || {};
    } else if (categorySlug) {
      metadata = getCategoryMetadata(categorySlug) || {};
    } else if (postId) {
      metadata = getPostMetadata(postId) || {};
    }

    // Merge custom metadata set by components
    metadata = { ...metadata, ...customMetadata };

    // FIXED: Added null as the second argument (defaultValue) to getSetting calls
    const finalTitle =
      metadata.title ||
      (getSetting("meta_title", null) as string | null) ||
      (getSetting("site_name", null) as string | null) ||
      "Forum";
    const finalDescription =
      metadata.description ||
      (getSetting("meta_description", null) as string | null) ||
      (getSetting("site_description", null) as string | null) ||
      "A community forum.";
    const finalKeywords =
      metadata.keywords ||
      (getSetting("meta_keywords", null) as string | null) ||
      "forum, community, discussion";
    const finalCanonical =
      metadata.canonical ||
      currentPath ||
      (getSetting("canonical_url", null) as string | null);
    const finalOgTitle = metadata.ogTitle || finalTitle;
    const finalOgDescription = metadata.ogDescription || finalDescription;
    const finalOgImage =
      metadata.ogImage ||
      (getSetting("og_image", null) as string | null) ||
      "/images/default-og.jpg";

    // FIXED: Added null as the second argument (defaultValue) to getSetting
    document.title =
      (getSetting("site_name", null) as string | null) ?? "Forum"; // Explicitly cast and provide fallback

    updateMetaTag("title", finalTitle);
    updateMetaTag("description", finalDescription);
    updateMetaTag("keywords", finalKeywords);

    // Update canonical link
    let canonicalLink = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (finalCanonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", finalCanonical);
    } else if (canonicalLink) {
      document.head.removeChild(canonicalLink);
    }

    // Update Open Graph tags
    updateMetaTag("og:title", finalOgTitle, true);
    updateMetaTag("og:description", finalOgDescription, true);
    updateMetaTag("og:image", finalOgImage, true);
    updateMetaTag("og:type", "website", true); // Assuming type is always website for now

    // Update Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image"); // Assuming this is constant
    updateMetaTag("twitter:title", finalOgTitle); // Often same as og:title
    updateMetaTag("twitter:description", finalOgDescription); // Often same as og:description
    updateMetaTag("twitter:image", finalOgImage); // Often same as og:image
  }, [
    pathname,
    params,
    searchParams,
    customMetadata,
    getSetting,
    currentPath,
    defaultTitle, // These will now correctly reflect the initial getSetting calls
    defaultDescription, // These will now correctly reflect the initial getSetting calls
    user?.id,
  ]);

  return (
    <MetadataContext.Provider value={{ setPageMetadata }}>
      {children}
    </MetadataContext.Provider>
  );
};
