"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import * as Sentry from "@sentry/react";
import { AdSpaceManager } from "./AdSpaceManager";
import { HeaderScriptsManager } from "./HeaderScriptsManager";
import { AdAnalytics } from "./AdAnalytics";
import { AdvertisingSettings } from "./AdvertisingSettings";

export default function AdminAdvertising() {
  const [activeTab, setActiveTab] = useState("spaces");

  // Track tab switch in Sentry
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "admin",
      message: `Advertising tab changed to: ${activeTab}`,
      level: "info",
    });

    Sentry.setContext("admin-advertising", {
      currentTab: activeTab,
    });
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advertising Management</h1>
        <p className="text-muted-foreground">
          Manage ad spaces, header scripts, and advertising settings for your
          forum.
        </p>
      </div>

      <Tabs
        defaultValue="spaces"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        {/* ADDED: flex-wrap to allow tabs to wrap on smaller screens */}
        <TabsList className="flex flex-wrap h-auto">
          {" "}
          {/* h-auto ensures height adjusts */}
          <TabsTrigger value="spaces">Ad Spaces</TabsTrigger>
          <TabsTrigger value="scripts">Header Scripts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="spaces">
          <AdSpaceManager />
        </TabsContent>

        <TabsContent value="scripts">
          <HeaderScriptsManager />
        </TabsContent>

        <TabsContent value="analytics">
          <AdAnalytics />
        </TabsContent>

        <TabsContent value="settings">
          <AdvertisingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
