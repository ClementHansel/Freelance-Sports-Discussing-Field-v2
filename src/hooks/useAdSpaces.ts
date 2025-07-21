"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdSpace {
  id: string;
  name: string;
  description?: string;
  location: string;
  device_targeting: "desktop" | "mobile" | "both";
  is_active: boolean;
  ad_code?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useAdSpaces = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adSpaces, isLoading } = useQuery({
    queryKey: ["adSpaces"],
    queryFn: async () => {
      console.log("🔍 Fetching ad spaces...");
      const { data, error } = await supabase
        .from("ad_spaces")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("❌ Error fetching ad spaces:", error);
        throw error;
      }

      console.log("✅ Fetched ad spaces:", data);
      return data as AdSpace[];
    },
  });

  const createAdSpace = useMutation({
    mutationFn: async (
      adSpace: Omit<AdSpace, "id" | "created_at" | "updated_at" | "created_by">
    ) => {
      console.log("💾 Creating ad space with data:", adSpace);

      const { data, error } = await supabase
        .from("ad_spaces")
        .insert([adSpace])
        .select()
        .single();

      if (error) {
        console.error("❌ Database error creating ad space:", error);
        console.error("Error details:", {
          message: error.message,
          hint: error.hint,
          details: error.details,
        });
        throw error;
      }

      console.log("✅ Ad space created in database:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adSpaces"] });
      toast({
        title: "Success",
        description: "Ad space created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create ad space: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateAdSpace = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<AdSpace> & { id: string }) => {
      const { data, error } = await supabase
        .from("ad_spaces")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adSpaces"] });
      toast({
        title: "Success",
        description: "Ad space updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update ad space: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteAdSpace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_spaces").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adSpaces"] });
      toast({
        title: "Success",
        description: "Ad space deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete ad space: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    adSpaces: adSpaces || [],
    isLoading,
    createAdSpace,
    updateAdSpace,
    deleteAdSpace,
  };
};

export const useActiveAdSpaces = (
  location?: string,
  deviceType?: "desktop" | "mobile"
) => {
  return useQuery({
    queryKey: ["activeAdSpaces", location, deviceType],
    queryFn: async () => {
      let query = supabase.from("ad_spaces").select("*").eq("is_active", true);

      if (location) {
        query = query.eq("location", location);
      }

      if (deviceType) {
        query = query.in("device_targeting", [deviceType, "both"]);
      }

      const { data, error } = await query.order("display_order", {
        ascending: true,
      });

      if (error) throw error;
      return data as AdSpace[];
    },
  });
};
