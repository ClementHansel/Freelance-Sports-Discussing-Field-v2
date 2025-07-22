"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types"; // Import Database for precise types

// Type for a basic category row from your database
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

// Recursive type for category with nested parent hierarchy
export interface CategoryWithHierarchy extends CategoryRow {
  // Override parent_category_id to be nullable if it's not already in CategoryRow
  // This ensures consistency with how it's used (data.parent_category_id)
  parent_category_id: string | null;
  // The 'parent_category' property will be the recursively fetched parent
  parent_category?: CategoryWithHierarchy | null; // Optional, and can be null
}

export const useCategoryBySlug = (
  categorySlug: string,
  subcategorySlug?: string
) => {
  return useQuery<CategoryWithHierarchy | null>({
    // Explicitly type the query result
    queryKey: ["category-by-slug", categorySlug, subcategorySlug],
    queryFn: async () => {
      console.log("Fetching category by slug:", {
        categorySlug,
        subcategorySlug,
      });

      if (subcategorySlug) {
        // Hierarchical: validate parent-child relationship
        const { data: parentCategory, error: parentError } = await supabase
          .from("categories")
          .select("id, slug, name")
          .eq("slug", categorySlug)
          .single();

        if (parentError) {
          console.error("Error fetching parent category:", parentError);
          throw parentError;
        }

        if (!parentCategory) {
          // If parent category not found, then subcategory cannot exist under it
          return null;
        }

        // Explicitly type the select for childCategory
        const { data: childCategory, error: childError } = await supabase
          .from("categories")
          .select(
            `
            *,
            parent_category:categories!parent_category_id(
              id, name, slug,
              parent_category:categories!parent_category_id(
                id, name, slug,
                parent_category:categories!parent_category_id(
                  id, name, slug
                )
              )
            )
            `
          )
          .eq("slug", subcategorySlug)
          .eq("parent_category_id", parentCategory.id)
          .single();

        if (childError) {
          console.error("Error fetching subcategory:", childError);
          throw childError;
        }

        console.log("Subcategory fetched by slug:", childCategory);
        // Cast the result to the recursive type
        return (childCategory as unknown as CategoryWithHierarchy) || null;
      } else {
        // Single category - build complete hierarchy recursively
        const buildCategoryHierarchy = async (
          slug: string
        ): Promise<CategoryWithHierarchy | null> => {
          // Explicit return type
          console.log(`Fetching category with slug: ${slug}`);
          const { data, error } = await supabase
            .from("categories")
            .select("*")
            .eq("slug", slug)
            .single();

          if (error) {
            console.error("Error fetching category by slug:", error);
            throw error;
          }

          if (!data) {
            return null; // Category not found
          }

          console.log(`Category fetched for slug ${slug}:`, data);

          // If this category has a parent, recursively fetch the parent hierarchy
          if (data.parent_category_id) {
            console.log(
              `Found parent category ID ${data.parent_category_id} for ${data.name}`
            );

            // First get the parent category's slug and ensure it exists
            const { data: parentData, error: parentError } = await supabase
              .from("categories")
              .select("slug")
              .eq("id", data.parent_category_id)
              .single();

            if (parentError) {
              console.error(
                "Error fetching parent category slug:",
                parentError
              );
              throw parentError;
            }

            if (!parentData) {
              // Parent slug not found, treat as root for this branch
              return data as CategoryWithHierarchy;
            }

            // Recursively build the parent hierarchy
            const parentWithHierarchy = await buildCategoryHierarchy(
              parentData.slug
            );

            const result: CategoryWithHierarchy = {
              // Explicitly type result
              ...(data as CategoryRow), // Cast data to CategoryRow for spread
              parent_category: parentWithHierarchy,
            };
            console.log(`Built hierarchy for ${data.name}:`, result);
            return result;
          }

          console.log(`No parent found for ${data.name}, returning as root`);
          return data as CategoryWithHierarchy; // Cast data to the final type
        };

        const categoryWithHierarchy = await buildCategoryHierarchy(
          categorySlug
        );
        console.log(
          "Final category with complete hierarchy:",
          categoryWithHierarchy
        );
        return categoryWithHierarchy;
      }
    },
    enabled: !!categorySlug,
  });
};
