"use client";

import React, { useState } from "react";
import * as Sentry from "@sentry/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForumSettings } from "@/hooks/useForumSettings";
import { useEnhancedForumStats } from "@/hooks/useEnhancedForumStats";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import {
  Save,
  Settings,
  Users,
  Shield,
  Database,
  BarChart3,
  Eye,
  TrendingUp,
  Calendar,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import { AnalyticsSettings } from "@/components/dashboard/admin/AnalyticsSettings";

// Changed to default export for Next.js page files
export default function AdminSettings() {
  const { toast } = useToast();
  const { settings, isLoading, updateSetting, getSetting } = useForumSettings();
  const { data: stats, isLoading: statsLoading } = useEnhancedForumStats();

  // Local state for form inputs
  const [headerCode, setHeaderCode] = useState("");
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [bannerMessage, setBannerMessage] = useState("");
  const [forumDescription, setForumDescription] = useState("");

  // Set Sentry tags & context once on mount
  React.useEffect(() => {
    Sentry.setTag("page", "admin_settings");
    Sentry.setContext("userRole", { role: "admin" });
  }, []);

  // Update local state when settings load
  React.useEffect(() => {
    if (settings) {
      try {
        // Explicitly cast the return values to the expected string type
        const headerCodeValue = getSetting("header_code", "") as string;
        const gaIdValue = getSetting("google_analytics_id", "") as string;
        const customCssValue = getSetting("custom_css", "") as string;
        const termsValue = getSetting("terms_content", "") as string;
        const privacyValue = getSetting("privacy_content", "") as string;
        const bannerMessageValue = getSetting("banner_message", "") as string;
        const forumDescriptionValue = getSetting(
          "forum_description",
          "A community forum for minor hockey discussions"
        ) as string;

        console.log("Loading settings:", {
          headerCodeValue,
          gaIdValue,
          customCssValue,
        });

        setHeaderCode(headerCodeValue);
        setGoogleAnalyticsId(gaIdValue);
        setCustomCss(customCssValue);
        setTermsContent(termsValue);
        setPrivacyContent(privacyValue);
        setBannerMessage(bannerMessageValue);
        setForumDescription(forumDescriptionValue);
      } catch (error) {
        console.error("Failed to load settings:", error);
        Sentry.captureException(error);
      }
    }
  }, [settings, getSetting]); // Added getSetting to dependencies for completeness, though it's stable

  const handleSaveGeneral = async () => {
    try {
      await Promise.all([
        // Assuming updateSetting handles the actual save operation
        updateSetting({
          key: "forum_name",
          value: getSetting("forum_name", "Minor Hockey Talks") as string, // Use current value from getSetting and cast
          type: "string",
          category: "general",
        }),
        updateSetting({
          key: "forum_description",
          value: forumDescription,
          type: "string",
          category: "general",
        }),
        updateSetting({
          key: "allow_registration",
          value: getSetting("allow_registration", true) as boolean, // Cast to boolean
          type: "boolean",
          category: "general",
        }),
        updateSetting({
          key: "allow_anonymous_posts",
          value: getSetting("allow_anonymous_posts", true) as boolean, // Cast to boolean
          type: "boolean",
          category: "general",
        }),
      ]);
      // Social media links are updated directly via onChange/updateSetting in their respective inputs
      toast({
        title: "General Settings Saved",
        description: "Your general forum settings have been updated.",
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Error",
        description: "Failed to save general settings.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTechnical = async () => {
    try {
      await Promise.all([
        updateSetting({
          key: "header_code",
          value: headerCode,
          type: "code",
          category: "technical",
          description: "Custom HTML code to inject in header",
        }),
        updateSetting({
          key: "google_analytics_id",
          value: googleAnalyticsId,
          type: "string",
          category: "technical",
          description: "Google Analytics tracking ID",
        }),
      ]);
      toast({
        title: "Technical Settings Saved",
        description: "Your technical settings have been updated.",
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Error",
        description: "Failed to save technical settings.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAppearance = async () => {
    try {
      await updateSetting({
        key: "custom_css",
        value: customCss,
        type: "code",
        category: "appearance",
        description: "Custom CSS styles",
      });
      toast({
        title: "Appearance Settings Saved",
        description: "Your appearance settings have been updated.",
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Error",
        description: "Failed to save appearance settings.",
        variant: "destructive",
      });
    }
  };

  const handleBackupDatabase = async () => {
    // FIX: Replace confirm() with a custom modal in a real app
    try {
      const confirm = window.confirm(
        "Are you sure you want to create a database backup? This operation might take a while."
      );
      if (!confirm) return;

      toast({
        title: "Backup Started",
        description:
          "Database backup has been initiated (functionality to be implemented)",
      });
      // Future: send API trigger to backup
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Error",
        description: "Failed to initiate backup.",
        variant: "destructive",
      });
    }
  };

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color = "text-primary",
  }: {
    title: string;
    value: number | string;
    change?: string;
    icon: React.ElementType; // Use React.ElementType for component prop
    color?: string;
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && <p className="text-xs text-muted-foreground">{change}</p>}
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure forum settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Technical
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Traffic Stats
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forum-name">Forum Name</Label>
                  <Input
                    id="forum-name"
                    value={
                      getSetting("forum_name", "Minor Hockey Talks") as string
                    } // Cast
                    onChange={(e) =>
                      updateSetting({
                        key: "forum_name",
                        value: e.target.value,
                        type: "string",
                        category: "general",
                      })
                    }
                    placeholder="Enter forum name"
                  />
                </div>

                {/* Site Banner Section */}
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="font-medium mb-3">Site-Wide Banner</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Display a banner message at the top of every page for all
                      visitors
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Banner</Label>
                      <div className="text-sm text-muted-foreground">
                        Show banner to all site visitors
                      </div>
                    </div>
                    <Switch
                      checked={getSetting("banner_enabled", false) as boolean} // Cast
                      onCheckedChange={(checked) =>
                        updateSetting({
                          key: "banner_enabled",
                          value: checked,
                          type: "boolean",
                          category: "banner",
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner-message">Banner Message</Label>
                    <Textarea
                      id="banner-message"
                      value={bannerMessage}
                      onChange={(e) => setBannerMessage(e.target.value)}
                      onBlur={() =>
                        updateSetting({
                          // Save on blur
                          key: "banner_message",
                          value: bannerMessage,
                          type: "string",
                          category: "banner",
                        })
                      }
                      placeholder="Enter banner message..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="banner-style">Banner Style</Label>
                      <Select
                        value={getSetting("banner_style", "info") as string} // Cast
                        onValueChange={(value) =>
                          updateSetting({
                            key: "banner_style",
                            value: value,
                            type: "string",
                            category: "banner",
                          })
                        }
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select banner style" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="info">Info (Blue)</SelectItem>
                          <SelectItem value="warning">
                            Warning (Yellow)
                          </SelectItem>
                          <SelectItem value="success">
                            Success (Green)
                          </SelectItem>
                          <SelectItem value="error">Error (Red)</SelectItem>
                          <SelectItem value="announcement">
                            Announcement (Purple)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dismissible</Label>
                        <div className="text-sm text-muted-foreground">
                          Allow users to close banner
                        </div>
                      </div>
                      <Switch
                        checked={
                          getSetting("banner_dismissible", true) as boolean
                        } // Cast
                        onCheckedChange={(checked) =>
                          updateSetting({
                            key: "banner_dismissible",
                            value: checked,
                            type: "boolean",
                            category: "banner",
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Cast the boolean value for conditional rendering */}
                  {(getSetting("banner_enabled", false) as boolean) && (
                    <div className="bg-muted/50 border rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">Preview:</p>
                      <div
                        className={`p-2 border rounded text-sm ${
                          (getSetting("banner_style", "info") as string) ===
                          "warning"
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-800"
                            : (getSetting("banner_style", "info") as string) ===
                              "success"
                            ? "bg-green-500/10 border-green-500/20 text-green-800"
                            : (getSetting("banner_style", "info") as string) ===
                              "error"
                            ? "bg-red-500/10 border-red-500/20 text-red-800"
                            : (getSetting("banner_style", "info") as string) ===
                              "announcement"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-800"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-800"
                        }`}
                      >
                        {bannerMessage ||
                          "Your banner message will appear here..."}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forum-description">Forum Description</Label>
                  <Textarea
                    id="forum-description"
                    value={forumDescription}
                    onChange={(e) => setForumDescription(e.target.value)}
                    onBlur={() =>
                      updateSetting({
                        // Save on blur
                        key: "forum_description",
                        value: forumDescription,
                        type: "string",
                        category: "general",
                      })
                    }
                    placeholder="Enter forum description"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow User Registration</Label>
                    <div className="text-sm text-muted-foreground">
                      Allow new users to register accounts
                    </div>
                  </div>
                  <Switch
                    checked={getSetting("allow_registration", true) as boolean} // Cast
                    onCheckedChange={(checked) =>
                      updateSetting({
                        key: "allow_registration",
                        value: checked,
                        type: "boolean",
                        category: "general",
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Anonymous Posts</Label>
                    <div className="text-sm text-muted-foreground">
                      Allow users to post anonymously
                    </div>
                  </div>
                  <Switch
                    checked={
                      getSetting("allow_anonymous_posts", true) as boolean
                    } // Cast
                    onCheckedChange={(checked) =>
                      updateSetting({
                        key: "allow_anonymous_posts",
                        value: checked,
                        type: "boolean",
                        category: "general",
                      })
                    }
                  />
                </div>

                {/* Social Media Section */}
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="font-medium mb-3">Social Media Links</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your social media URLs to display links on your forum
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="facebook-url"
                        className="flex items-center gap-2"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook URL
                      </Label>
                      <Input
                        id="facebook-url"
                        value={getSetting("social_facebook", "") as string} // Cast
                        onChange={(e) =>
                          updateSetting({
                            key: "social_facebook",
                            value: e.target.value,
                            type: "string",
                            category: "social",
                          })
                        }
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="twitter-url"
                        className="flex items-center gap-2"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter/X URL
                      </Label>
                      <Input
                        id="twitter-url"
                        value={getSetting("social_twitter", "") as string} // Cast
                        onChange={(e) =>
                          updateSetting({
                            key: "social_twitter",
                            value: e.target.value,
                            type: "string",
                            category: "social",
                          })
                        }
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="instagram-url"
                        className="flex items-center gap-2"
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram URL
                      </Label>
                      <Input
                        id="instagram-url"
                        value={getSetting("social_instagram", "") as string} // Cast
                        onChange={(e) =>
                          updateSetting({
                            key: "social_instagram",
                            value: e.target.value,
                            type: "string",
                            category: "social",
                          })
                        }
                        placeholder="https://instagram.com/youraccount"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="youtube-url"
                        className="flex items-center gap-2"
                      >
                        <Youtube className="h-4 w-4" />
                        YouTube URL
                      </Label>
                      <Input
                        id="youtube-url"
                        value={getSetting("social_youtube", "") as string} // Cast
                        onChange={(e) =>
                          updateSetting({
                            key: "social_youtube",
                            value: e.target.value,
                            type: "string",
                            category: "social",
                          })
                        }
                        placeholder="https://youtube.com/yourchannel"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveGeneral} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save General Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Legal Content Settings */}
        <TabsContent value="legal">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Legal Content Management
                </h2>
                <p className="text-muted-foreground">
                  Manage your Terms & Conditions and Privacy Policy content
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="terms-content">Terms & Conditions</Label>
                  <WysiwygEditor
                    value={termsContent}
                    onChange={setTermsContent}
                    placeholder="Enter terms and conditions content..."
                    height={300}
                    allowImages={true}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      updateSetting({
                        key: "terms_content",
                        value: termsContent,
                        type: "text",
                        category: "legal",
                      });
                      toast({
                        title: "Terms Updated",
                        description:
                          "Terms & Conditions have been updated successfully.",
                      });
                    }}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Terms & Conditions
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy-content">Privacy Policy</Label>
                  <WysiwygEditor
                    value={privacyContent}
                    onChange={setPrivacyContent}
                    placeholder="Enter privacy policy content..."
                    height={300}
                    allowImages={true}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      updateSetting({
                        key: "privacy_content",
                        value: privacyContent,
                        type: "text",
                        category: "legal",
                      });
                      toast({
                        title: "Privacy Policy Updated",
                        description:
                          "Privacy Policy has been updated successfully.",
                      });
                    }}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Privacy Policy
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Technical Settings */}
        <TabsContent value="technical">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Technical Settings
                </h2>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="header-code">Header Code</Label>
                  <Textarea
                    id="header-code"
                    value={headerCode}
                    onChange={(e) => setHeaderCode(e.target.value)}
                    placeholder="Enter custom HTML code to inject in the header (Google Analytics, etc.)"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    HTML code entered here will be injected into the site
                    header. Useful for analytics codes, custom scripts, etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google-analytics">
                    Google Analytics Tracking ID
                  </Label>
                  <Input
                    id="google-analytics"
                    value={googleAnalyticsId}
                    onChange={(e) => {
                      console.log("GA input changed:", e.target.value);
                      setGoogleAnalyticsId(e.target.value);
                    }}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your Google Analytics 4 tracking ID to enable visitor
                    tracking
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveTechnical} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Technical Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Appearance Settings
                </h2>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-css">Custom CSS</Label>
                  <Textarea
                    id="custom-css"
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    placeholder="Enter custom CSS styles"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom CSS styles will be applied to the entire forum
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveAppearance} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Appearance Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Traffic Stats */}
        <TabsContent value="stats">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Traffic Statistics</h2>
              <p className="text-muted-foreground">
                Monitor your forum's activity and growth
              </p>
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Topics"
                    value={stats.total_topics || 0}
                    icon={TrendingUp}
                    color="text-blue-500"
                  />
                  <StatCard
                    title="Total Posts"
                    value={stats.total_posts || 0}
                    icon={TrendingUp}
                    color="text-green-500"
                  />
                  <StatCard
                    title="Total Members"
                    value={stats.total_members || 0}
                    icon={Users}
                    color="text-purple-500"
                  />
                  <StatCard
                    title="Today's Topics"
                    value={stats.topics_today || 0}
                    icon={Calendar}
                    color="text-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Today's Posts"
                    value={stats.posts_today || 0}
                    icon={Calendar}
                    color="text-red-500"
                  />
                  <StatCard
                    title="New Members Today"
                    value={stats.members_today || 0}
                    icon={Users}
                    color="text-teal-500"
                  />
                  <StatCard
                    title="This Week's Topics"
                    value={stats.topics_this_week || 0}
                    icon={TrendingUp}
                    color="text-indigo-500"
                  />
                  <StatCard
                    title="This Week's Posts"
                    value={stats.posts_this_week || 0}
                    icon={TrendingUp}
                    color="text-pink-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-2">Most Active Category</h3>
                    <p className="text-2xl font-bold text-primary">
                      {stats.most_active_category || "No activity yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">This week</p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-2">Top Poster</h3>
                    <p className="text-2xl font-bold text-primary">
                      {stats.top_poster || "No posts yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">This week</p>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground">
                  Unable to load statistics
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Settings */}
        <TabsContent value="analytics">
          <AnalyticsSettings />
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  System Management
                </h2>
              </div>

              <div className="grid gap-6">
                {/* Maintenance Mode Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-orange-600 dark:text-orange-400">
                      ⚠️ Maintenance Mode
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Take the site offline for general users while allowing
                      admin access
                    </p>

                    <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium">
                            Enable Maintenance Mode
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            Site will be offline for non-admin users
                          </div>
                        </div>
                        <Switch
                          checked={
                            getSetting("maintenance_mode", false) as boolean
                          } // Cast
                          onCheckedChange={(checked) => {
                            updateSetting({
                              key: "maintenance_mode",
                              value: checked,
                              type: "boolean",
                              category: "system",
                            });
                            if (checked) {
                              toast({
                                title: "⚠️ Maintenance Mode Enabled",
                                description:
                                  "Site is now offline for general users. Only admins can access it.",
                                variant: "destructive",
                              });
                            } else {
                              toast({
                                title: "✅ Maintenance Mode Disabled",
                                description:
                                  "Site is now accessible to all users.",
                              });
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maintenance-message">
                          Maintenance Message
                        </Label>
                        <Textarea
                          id="maintenance-message"
                          value={
                            getSetting(
                              "maintenance_message",
                              "We are currently performing scheduled maintenance. Please check back soon!"
                            ) as string
                          } // Cast
                          onChange={(e) =>
                            updateSetting({
                              key: "maintenance_message",
                              value: e.target.value,
                              type: "text",
                              category: "system",
                            })
                          }
                          placeholder="Enter message to display during maintenance..."
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          This message will be displayed to users when the site
                          is in maintenance mode
                        </p>
                      </div>

                      {/* Cast for conditional rendering */}
                      {(getSetting("maintenance_mode", false) as boolean) && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            🔧 Maintenance mode is currently ACTIVE. Only admins
                            can access the site.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Database Management</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Backup and maintain database integrity
                    </p>
                    <Button onClick={handleBackupDatabase} disabled={isLoading}>
                      <Database className="h-4 w-4 mr-2" />
                      Create Database Backup
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium">Security Settings</h3>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable Rate Limiting</Label>
                          <div className="text-sm text-muted-foreground">
                            Limit request frequency per user
                          </div>
                        </div>
                        <Switch
                          checked={
                            getSetting("enable_rate_limiting", true) as boolean
                          } // Cast
                          onCheckedChange={(checked) =>
                            updateSetting({
                              key: "enable_rate_limiting",
                              value: checked,
                              type: "boolean",
                              category: "security",
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
