// src/hooks/useCategoryBySlug.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "./useCategories"; // Import the base Category interface

// Define a common interface for Supabase errors
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// Define the options interface specifically for useCategoryBySlug
interface UseCategoryBySlugOptions {
  categorySlug: string;
  subcategorySlug?: string; // Optional for hierarchical categories
  initialData?: Category | null; // Allow initial data for SSR hydration, can be null
  enabled?: boolean; // Allow disabling the query
}

export const useCategoryBySlug = (
  options: UseCategoryBySlugOptions, // Accept a single options object
) => {
  const {
    categorySlug,
    subcategorySlug,
    initialData,
    enabled = true,
  } = options;

  return useQuery<Category | null>({ // Explicitly type the query result
    queryKey: ["category-by-slug", categorySlug, subcategorySlug],
    queryFn: async () => {
      console.log("Fetching category by slug:", {
        categorySlug,
        subcategorySlug,
      });

      let categoryData: Category | null = null;
      // Corrected: Use SupabaseError type for categoryError
      let categoryError: SupabaseError | null = null;

      if (subcategorySlug) {
        // Hierarchical: validate parent-child relationship
        const { data: parentCategory, error: parentError } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();

        if (parentError || !parentCategory) {
          console.error(
            "Error fetching parent category or parent not found:",
            parentError,
          );
          // If parent not found, then the full path is invalid
          return null;
        }

        const { data: childCategory, error: childError } = await supabase
          .from("categories")
          .select("*, parent_category_id") // Select all columns for the child category
          .eq("slug", subcategorySlug)
          .eq("parent_category_id", parentCategory.id)
          .single();

        if (childError || !childCategory) {
          console.error(
            "Error fetching child category or child not found:",
            childError,
          );
          return null;
        }

        categoryData = childCategory as Category;
        categoryError = childError as SupabaseError | null; // Cast error to SupabaseError
      } else {
        // Non-hierarchical: fetch directly by categorySlug
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", categorySlug)
          .single();

        categoryData = data as Category;
        categoryError = error as SupabaseError | null; // Cast error to SupabaseError
      }

      if (categoryError) {
        console.error("Error fetching category:", categoryError);
        // Only throw if it's a real error, not just no data found
        if (categoryError.code !== "PGRST116") { // PGRST116 is "No rows found"
          throw categoryError;
        }
      }

      console.log("Category fetched by slug:", categoryData);
      return categoryData;
    },
    initialData: initialData, // Hydrate with initial data if provided
    enabled: enabled && !!categorySlug, // Only run query if enabled and categorySlug is provided
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};
