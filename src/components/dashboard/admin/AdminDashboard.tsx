"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  Flag,
  TrendingUp,
  ExternalLink,
  Globe,
  Eye,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminActivity } from "@/hooks/useAdminActivity";
import { useActiveVisitors } from "@/hooks/useActiveVisitors";
import { LiveVisitorMonitor } from "./LiveVisitorMonitor";
import IPTrackingMonitor from "./IPTrackingMonitor";
import { formatDistanceToNow } from "date-fns";
import * as Sentry from "@sentry/react";

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useAdminStats();
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useAdminActivity();
  const { data: activeVisitors, isLoading: visitorsLoading } =
    useActiveVisitors();

  // 🔍 Log errors to Sentry
  useEffect(() => {
    if (statsError) {
      Sentry.captureException(statsError, {
        tags: { section: "AdminDashboard", hook: "useAdminStats" },
      });
    }

    if (activitiesError) {
      Sentry.captureException(activitiesError, {
        tags: { section: "AdminDashboard", hook: "useAdminActivity" },
      });
    }

    Sentry.addBreadcrumb({
      category: "admin",
      message: "AdminDashboard loaded",
      level: "info",
    });
  }, [statsError, activitiesError]);

  if (statsError || activitiesError) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Admin Dashboard
          </h2>
          <p className="text-gray-600">
            {statsError?.message ||
              activitiesError?.message ||
              "Unable to load admin data"}
          </p>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: "Active Visitors",
      value: visitorsLoading
        ? "..."
        : activeVisitors?.length?.toString() || "0",
      change: "Live now",
      changeType: "live",
      icon: Globe,
    },
    {
      title: "Total Users",
      value: statsLoading ? "..." : stats?.total_users?.toString() || "0",
      change: "+12%",
      changeType: "positive",
      icon: Users,
    },
    {
      title: "Total Posts",
      value: statsLoading ? "..." : stats?.total_posts?.toString() || "0",
      change: "+8%",
      changeType: "positive",
      icon: MessageSquare,
    },
    {
      title: "Pending Reports",
      value: statsLoading ? "..." : stats?.pending_reports?.toString() || "0",
      change: "No change",
      changeType: "neutral",
      icon: Flag,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Badge variant="outline" className="text-green-600 border-green-600">
          All Systems Operational
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p
                    className={`text-sm ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : stat.changeType === "live"
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {stat.changeType === "live"
                      ? stat.change
                      : `${stat.change} from last month`}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Icon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            activities.map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-gray-600 mx-2">
                        {activity.action}
                      </span>
                      {activity.topic_info &&
                      activity.topic_info.category_slug ? (
                        <Link
                          href={`/category/${
                            activity.topic_info.category_slug
                          }/${activity.topic_info.slug}${
                            activity.type === "post"
                              ? `#post-${activity.id}`
                              : ""
                          }`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          "{activity.content}"
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="font-medium">
                          "{activity.content}"
                        </span>
                      )}
                    </div>
                    {activity.ip_address && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">IP:</span>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                          {activity.ip_address}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500 ml-4">
                  {activity.time
                    ? `${formatDistanceToNow(new Date(activity.time))} ago`
                    : "Time unavailable"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </Card>

      <LiveVisitorMonitor />
      <IPTrackingMonitor />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Pending Moderation
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {statsLoading
              ? "Loading..."
              : `${stats?.pending_reports || 0} reports waiting for review`}
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
          >
            Review Reports →
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage user accounts and permissions
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
            asChild
          >
            <Link href="/admin/users">Manage Users →</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Forum Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure forum-wide settings
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
          >
            Open Settings →
          </Button>
        </Card>
      </div>
    </div>
  );
}
