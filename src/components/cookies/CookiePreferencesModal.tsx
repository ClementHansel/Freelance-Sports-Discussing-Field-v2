"use client";

import React, { useState } from "react";
import { Check, Shield, BarChart3, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CookieConsent, defaultConsent } from "@/lib/utils/cookieConsent";

interface CookiePreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consent: CookieConsent | null;
  onSave: (consent: Partial<CookieConsent>) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  open,
  onOpenChange,
  consent,
  onSave,
  onAcceptAll,
  onRejectAll,
}) => {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: consent?.analytics ?? defaultConsent.analytics,
    functional: consent?.functional ?? defaultConsent.functional,
  });

  const handleSave = () => {
    onSave(preferences);
    onOpenChange(false);
  };

  const handleAcceptAll = () => {
    onAcceptAll();
    onOpenChange(false);
  };

  const handleRejectAll = () => {
    onRejectAll();
    onOpenChange(false);
  };

  const cookieCategories = [
    {
      id: "essential" as const,
      title: "Essential Cookies",
      description:
        "These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services.",
      icon: Shield,
      required: true,
      examples: "Login status, shopping cart contents, form data",
    },
    {
      id: "analytics" as const,
      title: "Analytics Cookies",
      description:
        "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are most popular.",
      icon: BarChart3,
      required: false,
      examples: "Google Analytics, page views, user interactions",
    },
    {
      id: "functional" as const,
      title: "Functional Cookies",
      description:
        "These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers.",
      icon: Settings2,
      required: false,
      examples:
        "Language preferences, region selection, accessibility settings",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Choose which types of cookies you're comfortable with. You can
            change these settings at any time from the privacy settings page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {cookieCategories.map((category) => {
            const Icon = category.icon;
            const isEnabled = preferences[category.id];

            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Label
                          htmlFor={category.id}
                          className="text-sm font-medium"
                        >
                          {category.title}
                        </Label>
                        {category.required && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Examples: {category.examples}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={category.id}
                    checked={isEnabled}
                    disabled={category.required}
                    onCheckedChange={(checked) => {
                      if (!category.required) {
                        setPreferences((prev) => ({
                          ...prev,
                          [category.id]: checked,
                        }));
                      }
                    }}
                  />
                </div>
                {category.id !== "functional" && <Separator />}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleRejectAll}
            className="w-full sm:w-auto"
          >
            Reject All
          </Button>
          <Button
            variant="outline"
            onClick={handleAcceptAll}
            className="w-full sm:w-auto"
          >
            Accept All
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Check className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
