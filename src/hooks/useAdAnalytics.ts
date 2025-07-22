"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdAnalyticsData {
  ad_space_id: string;
  ad_space_name: string;
  impressions: number | null; // Changed to allow null
  clicks: number | null; // Changed to allow null
  revenue: number | null; // Changed to allow null
  ctr: number;
  date: string;
}

export interface AdAnalyticsSummary {
  total_impressions: number;
  total_clicks: number;
  total_revenue: number;
  average_ctr: number;
  impressions_growth: number;
  clicks_growth: number;
  revenue_growth: number;
  ctr_growth: number;
}

export const useAdAnalytics = (
  dateRange: "today" | "week" | "month" = "month"
) => {
  const { data: summary, isLoading: summaryLoading } =
    useQuery<AdAnalyticsSummary>({
      // Explicitly type useQuery
      queryKey: ["adAnalyticsSummary", dateRange],
      queryFn: async () => {
        const dateFilter = getDateFilter(dateRange);
        const previousDateFilter = getPreviousDateFilter(dateRange);

        // Get current period data
        const { data: currentData, error: currentError } = await supabase
          .from("ad_analytics")
          .select(
            `
          impressions,
          clicks,
          revenue
          `
          )
          .gte("date", dateFilter);

        if (currentError) throw currentError;

        // Get previous period data for comparison
        const { data: previousData, error: previousError } = await supabase
          .from("ad_analytics")
          .select(
            `
          impressions,
          clicks,
          revenue
          `
          )
          .gte("date", previousDateFilter)
          .lt("date", dateFilter);

        if (previousError) throw previousError;

        // Define a type for the accumulator in reduce
        type Totals = { impressions: number; clicks: number; revenue: number };

        // Calculate current totals
        const currentTotals: Totals = currentData?.reduce(
          (acc: Totals, item) => ({
            impressions: acc.impressions + (item.impressions ?? 0),
            clicks: acc.clicks + (item.clicks ?? 0),
            revenue: acc.revenue + (item.revenue ?? 0),
          }),
          { impressions: 0, clicks: 0, revenue: 0 }
        ) || { impressions: 0, clicks: 0, revenue: 0 };

        // Calculate previous totals
        const previousTotals: Totals = previousData?.reduce(
          (acc: Totals, item) => ({
            impressions: acc.impressions + (item.impressions ?? 0),
            clicks: acc.clicks + (item.clicks ?? 0),
            revenue: acc.revenue + (item.revenue ?? 0),
          }),
          { impressions: 0, clicks: 0, revenue: 0 }
        ) || { impressions: 0, clicks: 0, revenue: 0 };

        // Calculate growth percentages
        const calculateGrowth = (current: number, previous: number): number => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        const averageCtr =
          currentTotals.impressions > 0
            ? (currentTotals.clicks / currentTotals.impressions) * 100
            : 0;

        const previousCtr =
          previousTotals.impressions > 0
            ? (previousTotals.clicks / previousTotals.impressions) * 100
            : 0;

        return {
          total_impressions: currentTotals.impressions,
          total_clicks: currentTotals.clicks,
          total_revenue: currentTotals.revenue,
          average_ctr: averageCtr,
          impressions_growth: calculateGrowth(
            currentTotals.impressions,
            previousTotals.impressions
          ),
          clicks_growth: calculateGrowth(
            currentTotals.clicks,
            previousTotals.clicks
          ),
          revenue_growth: calculateGrowth(
            currentTotals.revenue,
            previousTotals.revenue
          ),
          ctr_growth: calculateGrowth(averageCtr, previousCtr),
        };
      },
    });

  const { data: adSpaceData, isLoading: adSpaceLoading } = useQuery<
    AdAnalyticsData[]
  >({
    // Explicitly type useQuery
    queryKey: ["adAnalyticsPerformance", dateRange],
    queryFn: async () => {
      const dateFilter = getDateFilter(dateRange);

      // Define the expected type for the data coming from the select query
      type AdAnalyticsSelectResult = {
        ad_space_id: string;
        impressions: number | null;
        clicks: number | null;
        revenue: number | null;
        ad_spaces: {
          name: string | null;
        } | null; // ad_spaces can be null if the join fails
      }[]; // It's an array of these objects

      const { data, error } = await supabase.from("ad_analytics").select(
        `
          ad_space_id,
          impressions,
          clicks,
          revenue,
          ad_spaces!inner (
            name
          )
          `
      ); // No .gte("date", dateFilter) here, assuming it's applied outside if needed for this specific query

      if (error) throw error;

      // Group by ad space and calculate totals
      const grouped =
        (data as AdAnalyticsSelectResult)?.reduce(
          (acc: Record<string, AdAnalyticsData>, item) => {
            const spaceId = item.ad_space_id;
            if (!acc[spaceId]) {
              acc[spaceId] = {
                ad_space_id: spaceId,
                ad_space_name:
                  (item.ad_spaces as { name: string | null })?.name ||
                  "Unknown", // Ensure name is handled as string | null
                impressions: 0,
                clicks: 0,
                revenue: 0,
                ctr: 0,
                date: dateFilter, // Use the dateFilter for the grouped data
              };
            }

            acc[spaceId].impressions =
              (acc[spaceId].impressions ?? 0) + (item.impressions ?? 0); // Use nullish coalescing
            acc[spaceId].clicks =
              (acc[spaceId].clicks ?? 0) + (item.clicks ?? 0); // Use nullish coalescing
            acc[spaceId].revenue =
              (acc[spaceId].revenue ?? 0) + (item.revenue ?? 0); // Use nullish coalescing

            return acc;
          },
          {} as Record<string, AdAnalyticsData>
        ) || {};

      // Calculate CTR for each ad space
      const result = Object.values(grouped).map((space) => ({
        ...space,
        ctr:
          (space.impressions ?? 0) > 0
            ? ((space.clicks ?? 0) / (space.impressions ?? 0)) * 100
            : 0, // Ensure null checks
      }));

      return result;
    },
  });

  return {
    summary: summary || {
      total_impressions: 0,
      total_clicks: 0,
      total_revenue: 0,
      average_ctr: 0,
      impressions_growth: 0,
      clicks_growth: 0,
      revenue_growth: 0,
      ctr_growth: 0,
    },
    adSpacePerformance: adSpaceData || [],
    isLoading: summaryLoading || adSpaceLoading,
  };
};

const getDateFilter = (dateRange: string): string => {
  const now = new Date();
  switch (dateRange) {
    case "today": {
      // Wrapped in block
      const today = now.toISOString().split("T")[0];
      return today;
    }
    case "week": {
      // Wrapped in block
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return weekAgo.toISOString().split("T")[0];
    }
    case "month":
    default: {
      // Wrapped in block
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return monthAgo.toISOString().split("T")[0];
    }
  }
};

const getPreviousDateFilter = (dateRange: string): string => {
  const now = new Date();
  switch (dateRange) {
    case "today": {
      // Wrapped in block
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return yesterday.toISOString().split("T")[0];
    }
    case "week": {
      // Wrapped in block
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return twoWeeksAgo.toISOString().split("T")[0];
    }
    case "month":
    default: {
      // Wrapped in block
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return twoMonthsAgo.toISOString().split("T")[0];
    }
  }
};
