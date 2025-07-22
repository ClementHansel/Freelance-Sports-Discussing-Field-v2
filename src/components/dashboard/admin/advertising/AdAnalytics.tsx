"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointer,
  Calendar,
} from "lucide-react";
import { useAdAnalytics } from "@/hooks/useAdAnalytics";

export const AdAnalytics = () => {
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">(
    "month"
  );
  const { summary, adSpacePerformance, isLoading } = useAdAnalytics(dateRange);

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-4 animate-pulse" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ad Analytics</h2>
          <p className="text-muted-foreground">
            Track performance of your advertising placements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select
            value={dateRange}
            onValueChange={(value: "today" | "week" | "month") =>
              setDateRange(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Impressions
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_impressions.toLocaleString()}
            </div>
            <p
              className={`text-xs ${getGrowthColor(
                summary.impressions_growth
              )}`}
            >
              {formatGrowth(summary.impressions_growth)} from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_clicks.toLocaleString()}
            </div>
            <p className={`text-xs ${getGrowthColor(summary.clicks_growth)}`}>
              {formatGrowth(summary.clicks_growth)} from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.average_ctr.toFixed(2)}%
            </div>
            <p className={`text-xs ${getGrowthColor(summary.ctr_growth)}`}>
              {formatGrowth(summary.ctr_growth)} from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.total_revenue.toFixed(2)}
            </div>
            <p className={`text-xs ${getGrowthColor(summary.revenue_growth)}`}>
              {formatGrowth(summary.revenue_growth)} from previous period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ad Space Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Space Performance</CardTitle>
          <CardDescription>
            Performance metrics for each advertising placement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adSpacePerformance.length > 0 ? (
            <div className="space-y-4">
              {adSpacePerformance.map((item) => (
                <div
                  key={item.ad_space_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{item.ad_space_name}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {/* Use nullish coalescing to provide default 0 for null values */}
                        {(item.impressions ?? 0).toLocaleString()} impressions
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointer className="h-3 w-3" />
                        {/* Use nullish coalescing to provide default 0 for null values */}
                        {(item.clicks ?? 0).toLocaleString()} clicks
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">
                        {/* Use nullish coalescing to provide default 0 for null values */}
                        {(item.ctr ?? 0).toFixed(2)}% CTR
                      </Badge>
                    </div>
                    <div className="font-medium">
                      {/* Use nullish coalescing to provide default 0 for null values */}
                      ${(item.revenue ?? 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No analytics data available
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Data will appear here once your ad spaces start receiving
                traffic.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            {adSpacePerformance.length > 0
              ? `Analytics for ${adSpacePerformance.length} ad space${
                  adSpacePerformance.length > 1 ? "s" : ""
                }`
              : "Create ad spaces and start collecting analytics data"}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" />
            <p>Detailed charts and analytics coming soon</p>
            <p className="text-sm">
              Advanced reporting features will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
