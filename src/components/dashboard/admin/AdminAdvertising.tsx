"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdSpaceManager } from "./advertising/AdSpaceManager";
import { HeaderScriptsManager } from "./advertising/HeaderScriptsManager";
import { AdvertisingSettings } from "./advertising/AdvertisingSettings";
import { AdAnalytics } from "./advertising/AdAnalytics";

export default function AdminAdvertising() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advertising Management</h1>
        <p className="text-muted-foreground">
          Manage ad spaces, header scripts, and advertising settings for your
          forum.
        </p>
      </div>

      <Tabs defaultValue="spaces" className="space-y-4">
        <TabsList>
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
