"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTempUser } from "@/hooks/useTempUser";

interface CategoryRequestData {
  name: string;
  description: string;
  justification: string;
  parentCategoryId?: string;
}

export const useCategoryRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["category-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_requests")
        .select(
          `
          *,
          categories!category_requests_parent_category_id_fkey(name),
          profiles!category_requests_requested_by_user_id_fkey(username),
          reviewer:profiles!category_requests_reviewed_by_fkey(username)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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
    mutationFn: async (requestData: CategoryRequestData) => {
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
    }: {
      id: string;
      status: "approved" | "rejected";
      adminNotes?: string;
    }) => {
      const { error } = await supabase
        .from("category_requests")
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
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
