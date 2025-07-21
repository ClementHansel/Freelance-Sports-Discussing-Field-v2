"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForumSettings } from "@/hooks/useForumSettings";
import { Monitor, Smartphone, AlertTriangle, BarChart3 } from "lucide-react";

export const AdvertisingSettings = () => {
  const { getSetting, updateSetting } = useForumSettings();

  const handleSettingChange = (key: string, value: any, type?: string) => {
    updateSetting({
      key,
      value,
      type: type || "string",
      category: "advertising",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Advertising Settings</h2>
        <p className="text-muted-foreground">
          Configure global advertising preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Control overall advertising behavior on your site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Advertising</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch to enable/disable all advertising
                </p>
              </div>
              <Switch
                checked={getSetting("advertising_enabled", "true") === "true"}
                onCheckedChange={(checked) =>
                  handleSettingChange(
                    "advertising_enabled",
                    checked.toString(),
                    "boolean"
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ads_frequency">Ads Between Posts Frequency</Label>
              <Input
                id="ads_frequency"
                type="number"
                min="1"
                max="10"
                value={getSetting("ads_between_posts_frequency", "3")}
                onChange={(e) =>
                  handleSettingChange(
                    "ads_between_posts_frequency",
                    e.target.value,
                    "number"
                  )
                }
              />
              <p className="text-sm text-muted-foreground">
                Show an ad after every N posts in topic discussions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Device Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Targeting
            </CardTitle>
            <CardDescription>
              Control advertising on different devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <div>
                  <Label>Desktop Advertising</Label>
                  <p className="text-sm text-muted-foreground">
                    Show ads on desktop devices
                  </p>
                </div>
              </div>
              <Switch
                checked={getSetting("ads_desktop_enabled", "true") === "true"}
                onCheckedChange={(checked) =>
                  handleSettingChange(
                    "ads_desktop_enabled",
                    checked.toString(),
                    "boolean"
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <div>
                  <Label>Mobile Advertising</Label>
                  <p className="text-sm text-muted-foreground">
                    Show ads on mobile devices
                  </p>
                </div>
              </div>
              <Switch
                checked={getSetting("ads_mobile_enabled", "true") === "true"}
                onCheckedChange={(checked) =>
                  handleSettingChange(
                    "ads_mobile_enabled",
                    checked.toString(),
                    "boolean"
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Ad Blocker Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ad Blocker Detection
            </CardTitle>
            <CardDescription>
              Configure what happens when ad blockers are detected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad_blocker_message">Ad Blocker Message</Label>
              <Textarea
                id="ad_blocker_message"
                value={getSetting(
                  "ad_blocker_message",
                  "Please consider disabling your ad blocker to support our site."
                )}
                onChange={(e) =>
                  handleSettingChange(
                    "ad_blocker_message",
                    e.target.value,
                    "string"
                  )
                }
                placeholder="Message to show when ad blocker is detected"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                This message will be displayed to users with ad blockers enabled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Legacy Header Code */}
        <Card>
          <CardHeader>
            <CardTitle>Legacy Header Code</CardTitle>
            <CardDescription>
              Manage the original header code setting (consider migrating to
              Header Scripts)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header_code">Header Code</Label>
              <Textarea
                id="header_code"
                value={getSetting("header_code", "")}
                onChange={(e) =>
                  handleSettingChange("header_code", e.target.value, "string")
                }
                placeholder="HTML/JavaScript code to inject into the page header"
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                This is the legacy header code. Consider using the Header
                Scripts manager for better organization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline">Save All Settings</Button>
      </div>
    </div>
  );
};
