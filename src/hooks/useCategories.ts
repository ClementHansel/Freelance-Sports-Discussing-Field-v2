// src/hooks/useCategories.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types"; // Import Database for precise types

// Type alias for the raw row from the Supabase 'categories' table
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  color: string | null; // From types.ts
  sort_order: number | null; // From types.ts
  is_active: boolean | null; // From types.ts
  created_at: string | null; // From types.ts
  // updated_at is NOT in Database["public"]["Tables"]["categories"]["Row"]
  // If you need an 'updated_at' for categories, it must be added to your DB schema
  // and then regenerate types. For now, we remove it from this interface.
  level: number; // From types.ts (non-nullable)
  parent_category_id: string | null;
  region: string | null;
  birth_year: number | null;
  play_level: string | null;
  requires_moderation: boolean | null; // From types.ts
  canonical_url: string | null; // From types.ts
  meta_description: string | null; // From types.ts
  meta_keywords: string | null; // From types.ts
  meta_title: string | null; // From types.ts
  og_description: string | null; // From types.ts
  og_image: string | null; // From types.ts
  og_title: string | null; // From types.ts
}

interface UseCategoriesOptions {
  parentId?: string | null;
  level?: number;
  enabled?: boolean; // Allow disabling the query
  initialData?: Category[]; // For SSR hydration
}

export const useCategories = (options?: UseCategoriesOptions) => {
  const { parentId, level, enabled = true, initialData } = options || {};

  return useQuery<Category[]>({
    queryKey: ["categories", parentId ?? null, level], // Use null for queryKey consistency
    queryFn: async () => {
      console.log(
        "Fetching categories with parentId:",
        parentId,
        "level:",
        level,
      );

      let query = supabase
        .from("categories")
        .select("*")
        .eq("is_active", true); // No order by sort_order if it's nullable and not always present for ordering

      if (parentId !== undefined) {
        if (parentId === null) {
          query = query.is("parent_category_id", null);
        } else {
          query = query.eq("parent_category_id", parentId);
        }
      }

      if (level !== undefined) {
        query = query.eq("level", level);
      }

      // Add ordering by sort_order if it's consistently populated in your DB
      // If sort_order can be null, ordering by it might not be what you want.
      // Assuming it's generally populated for ordering, we can add it.
      query = query.order("sort_order", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      console.log("Categories fetched:", data);
      // Explicitly map raw data to our Category interface
      return (data || []).map((row: CategoryRow) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        slug: row.slug,
        color: row.color,
        sort_order: row.sort_order, // Directly assign nullable
        is_active: row.is_active, // Directly assign nullable
        created_at: row.created_at, // Directly assign nullable
        level: row.level, // Directly assign non-nullable
        parent_category_id: row.parent_category_id,
        region: row.region,
        birth_year: row.birth_year,
        play_level: row.play_level,
        requires_moderation: row.requires_moderation,
        canonical_url: row.canonical_url,
        meta_description: row.meta_description,
        meta_keywords: row.meta_keywords,
        meta_title: row.meta_title,
        og_description: row.og_description,
        og_image: row.og_image,
        og_title: row.og_title,
      })) as Category[];
    },
    initialData: initialData, // Hydrate with initial data
    enabled: enabled, // Use the enabled option
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
};

interface UseCategoryByIdOptions {
  enabled?: boolean;
  initialData?: Category;
}

export const useCategoryById = (
  categoryId: string,
  options?: UseCategoryByIdOptions,
) => {
  const { enabled = true, initialData } = options || {};
  const isValidId = Boolean(
    categoryId && categoryId.length > 0 && categoryId !== "",
  );

  return useQuery<Category>({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      console.log("Fetching category by ID:", categoryId);

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching category:", error);
        throw error;
      }

      console.log("Category fetched:", data);
      // Explicitly map raw data to our Category interface for single item
      const row: CategoryRow = data as CategoryRow; // Cast to CategoryRow first
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        slug: row.slug,
        color: row.color,
        sort_order: row.sort_order,
        is_active: row.is_active,
        created_at: row.created_at,
        level: row.level,
        parent_category_id: row.parent_category_id,
        region: row.region,
        birth_year: row.birth_year,
        play_level: row.play_level,
        requires_moderation: row.requires_moderation,
        canonical_url: row.canonical_url,
        meta_description: row.meta_description,
        meta_keywords: row.meta_keywords,
        meta_title: row.meta_title,
        og_description: row.og_description,
        og_image: row.og_image,
        og_title: row.og_title,
      } as Category;
    },
    initialData: initialData,
    enabled: enabled && isValidId, // Only run query if ID is valid and enabled
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
};

// Recursive type for category with nested parent hierarchy (if still needed elsewhere)
export interface CategoryWithHierarchy extends Category {
  parent_category?: CategoryWithHierarchy | null; // Optional, and can be null
}

interface UseCategoryBySlugOptions {
  enabled?: boolean;
  initialData?: CategoryWithHierarchy | null; // Allow null for initial data
}

export const useCategoryBySlug = (
  categorySlug: string,
  options?: UseCategoryBySlugOptions,
) => {
  const { enabled = true, initialData } = options || {};
  const isValidSlug = Boolean(
    categorySlug && categorySlug.length > 0 && categorySlug !== "",
  );

  return useQuery<CategoryWithHierarchy | null>({
    queryKey: ["category-by-slug", categorySlug],
    queryFn: async () => {
      console.log("Fetching category by slug:", categorySlug);

      // Recursive helper function to build the hierarchy
      const buildCategoryHierarchy = async (
        slugToFetch: string,
      ): Promise<CategoryWithHierarchy | null> => {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slugToFetch)
          .eq("is_active", true)
          .single();

        if (error && error.code !== "PGRST116") { // PGRST116 means no rows found
          console.error(
            `Error fetching category by slug ${slugToFetch}:`,
            error,
          );
          throw error;
        }

        if (!data) {
          return null;
        }

        // Explicitly map raw data to our CategoryWithHierarchy interface
        const row: CategoryRow = data as CategoryRow; // Cast to CategoryRow first
        const currentCategory: CategoryWithHierarchy = {
          id: row.id,
          name: row.name,
          description: row.description,
          slug: row.slug,
          color: row.color,
          sort_order: row.sort_order,
          is_active: row.is_active,
          created_at: row.created_at,
          level: row.level,
          parent_category_id: row.parent_category_id,
          region: row.region,
          birth_year: row.birth_year,
          play_level: row.play_level,
          requires_moderation: row.requires_moderation,
          canonical_url: row.canonical_url,
          meta_description: row.meta_description,
          meta_keywords: row.meta_keywords,
          meta_title: row.meta_title,
          og_description: row.og_description,
          og_image: row.og_image,
          og_title: row.og_title,
        } as CategoryWithHierarchy;

        if (currentCategory.parent_category_id) {
          const { data: parentData, error: parentError } = await supabase
            .from("categories")
            .select("slug")
            .eq("id", currentCategory.parent_category_id)
            .single();

          if (parentError && parentError.code !== "PGRST116") {
            console.error(
              "Error fetching parent category slug for hierarchy:",
              parentError,
            );
            throw parentError;
          }

          if (parentData) {
            const parentWithHierarchy = await buildCategoryHierarchy(
              parentData.slug,
            );
            return {
              ...currentCategory,
              parent_category: parentWithHierarchy,
            } as CategoryWithHierarchy;
          }
        }
        return currentCategory; // Return as CategoryWithHierarchy
      };

      if (!isValidSlug) {
        return null;
      }

      const categoryWithHierarchy = await buildCategoryHierarchy(categorySlug);
      console.log(
        "Final category with complete hierarchy for slug:",
        categorySlug,
        categoryWithHierarchy,
      );
      return categoryWithHierarchy;
    },
    initialData: initialData,
    enabled: enabled && isValidSlug, // Only run if slug is valid and enabled
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
};
