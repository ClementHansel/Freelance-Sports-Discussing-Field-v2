"use client";

import React, { useState } from "react";
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

import { useForumSettings } from "@/hooks/useForumSettings";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types"; // Import Json type

export const AnalyticsSettings: React.FC = () => {
  const { getSetting, updateSetting, isUpdating } = useForumSettings();
  const { hasConsent } = useCookieConsent();
  const { toast } = useToast();

  // Explicitly cast the return value of getSetting to string
  const [gaTrackingId, setGaTrackingId] = useState(
    getSetting("google_analytics_id", "") as string
  );

  const handleSaveGA = async () => {
    updateSetting({
      key: "google_analytics_id",
      value: gaTrackingId as Json, // Explicitly cast to Json
      type: "string",
      category: "analytics",
      description: "Google Analytics tracking ID",
    });
  };

  const testGA = () => {
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
  };

  return (
    <div className="space-y-6">
      {/* Google Analytics */}
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
            <Label htmlFor="ga-tracking-id">
              Tracking ID (GA4 Measurement ID)
            </Label>
            <Input
              id="ga-tracking-id"
              placeholder="G-XXXXXXXXXX"
              value={gaTrackingId} // gaTrackingId is already typed as string
              onChange={(e) => setGaTrackingId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Google Analytics property settings
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
                  "User consent required for analytics"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={testGA}>
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
