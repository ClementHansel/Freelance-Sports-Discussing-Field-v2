"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  level: number;
  parent_category_id: string | null;
  region: string | null;
  birth_year: number | null;
  play_level: string | null;
}

export const useCategories = (parentId?: string | null, level?: number) => {
  return useQuery({
    queryKey: ["categories", parentId, level],
    queryFn: async () => {
      console.log(
        "Fetching categories with parentId:",
        parentId,
        "level:",
        level
      );

      let query = supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

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

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      console.log("Categories fetched:", data);
      return data as Category[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
};

export const useCategoryById = (categoryId: string) => {
  const isValidId = Boolean(
    categoryId &&
      categoryId.length > 0 &&
      categoryId !== "" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        categoryId
      )
  );

  return useQuery({
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
      return data as Category;
    },
    enabled: isValidId, // Only run query if ID is valid
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
};

export const useCategoryBySlug = (slug: string) => {
  const isValidSlug = Boolean(slug && slug.length > 0 && slug !== "");

  return useQuery({
    queryKey: ["category-slug", slug],
    queryFn: async () => {
      console.log("Fetching category by slug:", slug);

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching category by slug:", error);
        throw error;
      }

      console.log("Category by slug fetched:", data);
      return data as Category;
    },
    enabled: isValidSlug, // Only run query if slug is valid
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
};
