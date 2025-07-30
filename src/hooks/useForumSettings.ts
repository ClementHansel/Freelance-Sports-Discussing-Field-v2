// src/hooks/useForumSettings.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database, Json } from "@/integrations/supabase/types";

// Type for a single row from the forum_settings table as it comes from Supabase
type ForumSettingRow = Database["public"]["Tables"]["forum_settings"]["Row"];

// Type for the value stored in the settingsMap (after processing)
export interface MappedSettingValue {
  value: Json; // The processed value, can be any JSON-compatible type
  type: string;
  category: string;
  description: string | null;
  isPublic: boolean | null;
}

// Type for the final settings map returned by the hook
export interface ForumSettingsMap {
  [key: string]: MappedSettingValue;
}

interface UseForumSettingsOptions {
  // New: Optional initial data for hydration
  initialData?: ForumSettingsMap;
}

export const useForumSettings = ({
  initialData, // Destructure initialData
}: UseForumSettingsOptions = {}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    refetch,
    error, // FIXED: Expose the error object from useQuery
  } = useQuery<ForumSettingsMap>({
    queryKey: ["forum-settings"],
    queryFn: async () => {
      console.log(
        "Fetching forum settings via useForumSettings hook (client-side)",
      );
      const { data, error } = await supabase.from("forum_settings").select("*");

      if (error) {
        console.error("Error fetching forum settings:", error);
        throw error;
      }

      const mappedSettings: ForumSettingsMap = {};
      data.forEach((setting) => {
        let value: Json = setting.setting_value;
        // Ensure boolean values are correctly typed as boolean, not string
        if (setting.setting_type === "boolean") {
          value = value === "true" || value === true; // Handle both string "true" and boolean true
        } else if (value === null || value === undefined) {
          value = ""; // Default to empty string for null/undefined non-booleans
        }

        mappedSettings[setting.setting_key] = {
          value,
          type: setting.setting_type,
          category: setting.category,
          description: setting.description,
          isPublic: setting.is_public,
        };
      });

      // Add fallback for 'category_request_enabled' if not present
      if (!mappedSettings["category_request_enabled"]) {
        mappedSettings["category_request_enabled"] = {
          value: true, // Default to true if not found in DB
          type: "boolean",
          category: "moderation", // Or 'general', consistent with your other settings
          description:
            "Enable or disable category request feature (default fallback)",
          isPublic: true,
        };
      }

      console.log("Forum settings fetched:", mappedSettings);
      return mappedSettings;
    },
    initialData: initialData, // Pass initialData to useQuery
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({
      key,
      value,
      type,
      category,
      description,
    }: {
      key: string;
      value: Json;
      type?: string;
      category?: string;
      description?: string;
    }) => {
      console.log(`Updating setting: ${key} to ${value}`);
      const { error } = await supabase
        .from("forum_settings")
        .upsert(
          {
            setting_key: key,
            setting_value: value,
            setting_type: type,
            category: category,
            description: description,
          },
          { onConflict: "setting_key" },
        )
        .select();

      if (error) {
        console.error("Error updating setting:", error);
        toast({
          title: "Error updating setting",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      toast({
        title: "Setting updated",
        description: `Successfully updated '${key}'.`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-settings"] });
    },
  });

  const getSetting = <T extends Json>(
    key: string,
    defaultValue: T,
  ): T | undefined => {
    const setting = settings?.[key];
    if (!setting || setting.value === null || setting.value === undefined) {
      return defaultValue;
    }

    // Attempt to cast the value based on its stored type or infer
    if (setting.type === "boolean") {
      return (setting.value === true || setting.value === "true") as T;
    }
    if (setting.type === "number") {
      return Number(setting.value) as T;
    }
    if (setting.type === "string") {
      return String(setting.value) as T;
    }
    // For other types like 'json' or if type is not specified, return as is
    return setting.value as T;
  };

  const getSettingsByCategory = (category: string) => {
    if (!settings) return {};

    const categorySettings: ForumSettingsMap = {};
    Object.entries(settings).forEach(([key, setting]) => {
      if (setting.category === category) {
        categorySettings[key] = setting;
      }
    });
    return categorySettings;
  };

  const forceRefresh = () => {
    console.log("Force refreshing forum settings");
    queryClient.invalidateQueries({ queryKey: ["forum-settings"] });
    refetch();
  };

  useEffect(() => {
    console.log("Setting up real-time subscription for forum settings");

    const channel = supabase
      .channel("forum-settings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "forum_settings",
        },
        (payload) => {
          console.log("Forum settings changed, refreshing cache:", payload);
          queryClient.invalidateQueries({ queryKey: ["forum-settings"] });
          refetch();
        },
      )
      .subscribe();

    return () => {
      console.log("Cleaning up forum settings subscription");
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetch]);

  return {
    settings,
    isLoading,
    updateSetting: updateSettingMutation.mutate,
    isUpdating: updateSettingMutation.isPending,
    getSetting,
    getSettingsByCategory,
    forceRefresh,
    error, // FIXED: Return the error here
  };
};
