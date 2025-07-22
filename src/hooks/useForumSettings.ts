"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database, Json } from "@/integrations/supabase/types"; // Import Database and Json

// Type for a single row from the forum_settings table as it comes from Supabase
type ForumSettingRow = Database["public"]["Tables"]["forum_settings"]["Row"];

// Type for the value stored in the settingsMap (after processing)
interface MappedSettingValue {
  value: Json; // The processed value, can be any JSON-compatible type
  type: string;
  category: string;
  description: string | null;
  isPublic: boolean | null;
}

// Type for the final settings map returned by the hook
interface ForumSettingsMap {
  [key: string]: MappedSettingValue;
}

export const useForumSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<ForumSettingsMap>({
    // Explicitly type the data returned by useQuery
    queryKey: ["forum-settings"],
    queryFn: async () => {
      console.log("Fetching forum settings from database");

      const { data, error } = await supabase
        .from("forum_settings")
        .select("*")
        .order("category", { ascending: true })
        .order("setting_key", { ascending: true });

      if (error) {
        console.error("Error fetching forum settings:", error);
        throw error;
      }

      // Convert to a more usable format
      const settingsMap: ForumSettingsMap = {};
      data?.forEach((setting: ForumSettingRow) => {
        // Type 'setting' as ForumSettingRow
        let value: Json = setting.setting_value; // Use Json type for value

        console.log(
          "Processing setting:",
          setting.setting_key,
          "raw value:",
          value,
          "type:",
          typeof value
        );

        if (value === null || value === undefined) {
          value = ""; // Default to empty string if null/undefined
        } else {
          // No need for 'value = value;' as it's redundant (no-self-assign fix)
          // The value is already correctly typed as Json from Supabase.
        }

        console.log(
          "Final processed value for",
          setting.setting_key,
          ":",
          value
        );

        settingsMap[setting.setting_key] = {
          value,
          type: setting.setting_type,
          category: setting.category,
          description: setting.description,
          isPublic: setting.is_public,
        };
      });

      console.log("Forum settings fetched and mapped:", settingsMap);
      return settingsMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't always refetch on mount
  });

  const updateSettingMutation = useMutation<
    void,
    Error,
    {
      // Explicitly type mutation: Result, Error, Variables
      key: string;
      value: Json; // Changed 'any' to 'Json'
      type?: string;
      category?: string;
      description?: string;
    }
  >({
    mutationFn: async ({
      key,
      value,
      type = "string",
      category = "general",
      description,
    }) => {
      console.log("Updating forum setting:", { key, value, type, category });

      // For JSONB columns, you can often pass the value directly.
      // Supabase's RPC will handle the serialization/deserialization.
      // No need for manual toString() or JSON.stringify() unless the DB column expects a string representation
      // of a specific type (e.g., a number stored as text). Given it's a 'setting_value' likely JSONB, direct pass is best.
      const { error } = await supabase.rpc("set_forum_setting", {
        key_name: key,
        value: value, // Pass value directly as Json
        setting_type: type,
        category,
        description,
      });

      if (error) {
        console.error("Error updating forum setting:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-settings"] });
      toast({
        title: "Settings Updated",
        description: "Forum settings have been saved successfully",
      });
    },
    onError: (error: unknown) => {
      // Type error as unknown
      let errorMessage = "Failed to update forum settings";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Failed to update setting:", errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // getSetting function now returns 'unknown' to force type narrowing by consumer
  const getSetting = (key: string, defaultValue: unknown = ""): unknown => {
    // Changed 'any' to 'unknown'
    if (!settings) {
      console.log(
        "getSetting called but settings not loaded yet, returning default for key:",
        key
      );
      return defaultValue;
    }

    const setting = settings[key];
    if (!setting) {
      console.log(
        "getSetting: No setting found for key:",
        key,
        "returning default:",
        defaultValue
      );
      return defaultValue;
    }

    const value = setting.value;
    console.log(
      "getSetting called for key:",
      key,
      "value:",
      value,
      "type:",
      typeof value,
      "defaultValue:",
      defaultValue
    );

    // Handle null/undefined values
    if (value === null || value === undefined) {
      return defaultValue;
    }

    return value;
  };

  const getSettingsByCategory = (category: string) => {
    if (!settings) return {};

    const categorySettings: ForumSettingsMap = {}; // Type as ForumSettingsMap
    Object.entries(settings).forEach(([key, setting]) => {
      // setting is implicitly MappedSettingValue due to ForumSettingsMap type
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

  // Add real-time updates for forum settings
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
        }
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
  };
};
