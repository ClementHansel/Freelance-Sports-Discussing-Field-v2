"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTempUser } from "@/hooks/useTempUser";

// --- Interfaces for joined data ---
interface CategoryJoin {
  name: string;
  // If you select more fields from 'categories' table, add them here
  id: string; // Added id based on categories table in types.ts
  slug: string; // Added slug based on categories table in types.ts
}

interface ProfileJoin {
  username: string;
  id: string; // Added id based on profiles table in types.ts
}

// --- Main interface for the category request data including joined fields ---
// This should match the Supabase 'category_requests' table structure + joined data
export interface CategoryRequest {
  id: string;
  name: string;
  description: string; // Changed from string | null to string based on types.ts
  justification: string;
  status: "pending" | "approved" | "rejected"; // More specific than just 'string'
  requested_by_user_id: string | null; // From types.ts
  requester_display_name: string | null;
  parent_category_id: string | null;
  admin_notes: string | null;
  reviewed_by: string | null; // Foreign key to profiles table for the reviewer
  reviewed_at: string | null;
  created_at: string;
  updated_at: string; // From types.ts

  // Joined data from other tables (Supabase flattens these into the main object)
  categories: CategoryJoin | null; // Corresponds to categories!category_requests_parent_category_id_fkey(name)
  profiles: ProfileJoin | null; // Corresponds to profiles!category_requests_requested_by_user_id_fkey(username)
  reviewer: ProfileJoin | null; // Corresponds to reviewer:profiles!category_requests_reviewed_by_fkey(username)
}

// Interface for data used when creating a category request
interface CreateCategoryRequestData {
  name: string;
  description: string; // Changed from string | null to string based on types.ts
  justification: string;
  parentCategoryId?: string | null; // Make optional and allow null
}

// Interface for data used when updating a category request
interface UpdateCategoryRequestData {
  id: string;
  status?: "approved" | "rejected"; // Status can be updated
  adminNotes?: string | null; // Admin notes can be updated and can be null
  reviewed_by?: string | null; // Reviewer ID can be updated and can be null
  reviewed_at?: string | null; // Review timestamp can be updated and can be null
}

export const useCategoryRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Explicitly type the data returned by the query as an array of CategoryRequest
  const { data: requests, isLoading } = useQuery<CategoryRequest[]>({
    queryKey: ["category-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_requests")
        .select(
          `
          id,
          name,
          description,
          justification,
          status,
          requested_by_user_id,
          requester_display_name,
          parent_category_id,
          admin_notes,
          reviewed_by,
          reviewed_at,
          created_at,
          updated_at,
          categories!category_requests_parent_category_id_fkey(id, name, slug),
          profiles!category_requests_requested_by_user_id_fkey(id, username),
          reviewer:profiles!category_requests_reviewed_by_fkey(id, username)
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Assert the data to the CategoryRequest[] type
      return data as CategoryRequest[];
    },
  });

  return {
    requests,
    isLoading,
  };
};

export const useCreateCategoryRequest = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tempUser } = useTempUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: CreateCategoryRequestData) => {
      const { error } = await supabase.from("category_requests").insert({
        name: requestData.name,
        description: requestData.description,
        justification: requestData.justification,
        parent_category_id: requestData.parentCategoryId || null,
        requested_by_user_id: user?.id || tempUser?.id || null,
        requester_display_name:
          user?.username || tempUser?.display_name || "Anonymous",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-requests"] });
      toast({
        title: "Category request submitted",
        description: user
          ? "Your request has been sent to the administrators for review."
          : "Your anonymous request has been sent to the administrators for review.",
      });
    },
    onError: (error) => {
      console.error("Error creating category request:", error);
      toast({
        title: "Error",
        description: "Failed to submit category request. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCategoryRequest = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current user to set as reviewer
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
      reviewed_by,
      reviewed_at,
    }: UpdateCategoryRequestData) => {
      const updatePayload: Partial<CategoryRequest> = {
        status,
        admin_notes: adminNotes,
        // If reviewed_by is not provided, use the current user's ID
        // If user is null, set to null
        reviewed_by: reviewed_by === undefined ? user?.id || null : reviewed_by,
        reviewed_at:
          reviewed_at === undefined ? new Date().toISOString() : reviewed_at,
      };

      const { error } = await supabase
        .from("category_requests")
        .update(updatePayload)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-requests"] });
      toast({
        title: "Request updated",
        description: "Category request has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating category request:", error);
      toast({
        title: "Error",
        description: "Failed to update category request.",
        variant: "destructive",
      });
    },
  });
};
