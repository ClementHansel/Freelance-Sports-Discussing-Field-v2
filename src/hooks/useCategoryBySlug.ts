"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCategoryBySlug = (
  categorySlug: string,
  subcategorySlug?: string
) => {
  return useQuery({
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
        return childCategory;
      } else {
        // Single category - build complete hierarchy recursively
        const buildCategoryHierarchy = async (slug: string): Promise<any> => {
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

          console.log(`Category fetched for slug ${slug}:`, data);

          // If this category has a parent, recursively fetch the parent hierarchy
          if (data.parent_category_id) {
            console.log(
              `Found parent category ID ${data.parent_category_id} for ${data.name}`
            );

            // First get the parent category's slug
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

            // Recursively build the parent hierarchy
            const parentWithHierarchy = await buildCategoryHierarchy(
              parentData.slug
            );

            const result = {
              ...data,
              parent_category: parentWithHierarchy,
            };
            console.log(`Built hierarchy for ${data.name}:`, result);
            return result;
          }

          console.log(`No parent found for ${data.name}, returning as root`);
          return data;
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
