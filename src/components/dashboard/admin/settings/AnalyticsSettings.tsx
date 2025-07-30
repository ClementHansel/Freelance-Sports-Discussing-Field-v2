"use client";

import React, { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

import { useForumSettings } from "@/hooks/useForumSettings";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export const AnalyticsSettings: React.FC = () => {
  const { getSetting, updateSetting, isUpdating } = useForumSettings();
  const { hasConsent } = useCookieConsent();
  const { toast } = useToast();

  const [gaTrackingId, setGaTrackingId] = useState(
    getSetting("google_analytics_id", "") as string
  );

  const handleSaveGA = async () => {
    try {
      await updateSetting({
        key: "google_analytics_id",
        value: gaTrackingId.trim() as Json,
        type: "string",
        category: "analytics",
        description: "Google Analytics tracking ID",
      });

      toast({
        title: "Saved",
        description: "Google Analytics ID updated successfully",
      });
    } catch (error: unknown) {
      Sentry.captureException(error);

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Failed to update Google Analytics ID";

      toast({
        title: "Error Saving",
        description: message,
        variant: "destructive",
      });
    }
  };

  const testGA = () => {
    try {
      if (window.gtag && hasConsent("analytics")) {
        window.gtag("event", "test_event", {
          event_category: "admin",
          event_label: "settings_test",
        });

        toast({
          title: "Test Event Sent",
          description: "Check your Google Analytics real-time reports",
        });
      } else {
        toast({
          title: "Cannot Test",
          description: "Google Analytics not loaded or consent not given",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      Sentry.captureException(error);

      toast({
        title: "Error",
        description: "Something went wrong during test event",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Configure Google Analytics tracking for your forum
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ga-tracking-id">Tracking ID (GA4)</Label>
            <Input
              id="ga-tracking-id"
              placeholder="G-XXXXXXXXXX"
              value={gaTrackingId}
              onChange={(e) => setGaTrackingId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              You can find this ID in your Google Analytics admin panel.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={
                    window.gtag && hasConsent("analytics")
                      ? "default"
                      : "secondary"
                  }
                >
                  {window.gtag && hasConsent("analytics")
                    ? "Active"
                    : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {!hasConsent("analytics") &&
                  "User consent is required for analytics tracking."}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testGA}
                disabled={!gaTrackingId}
              >
                Test Tracking
              </Button>
              <Button onClick={handleSaveGA} disabled={isUpdating}>
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
