"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTopic } from "@/hooks/useCreateTopic";
import { useCreatePoll, CreatePollData } from "@/hooks/useCreatePoll"; // Import CreatePollData
import { useTempUser } from "@/hooks/useTempUser";
import { useEnhancedSpamDetection } from "@/hooks/useEnhancedSpamDetection";
import { SmartCategorySelector } from "./category/SmartCategorySelector";
import { PollCreator } from "./PollCreator";
import { toast } from "@/hooks/use-toast";

// Removed the local PollOption and PollData interfaces.
// We will now use CreatePollData imported from useCreatePoll.ts.

export const CreateTopic = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  // Debug auth state
  console.log("CreateTopic auth state:", { user, loading, userExists: !!user });
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
  });
  const [contentErrors, setContentErrors] = useState<string[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);

  const createTopicMutation = useCreateTopic();
  const createPollMutation = useCreatePoll();
  const tempUser = useTempUser();
  const spamDetection = useEnhancedSpamDetection();

  // Pre-select category if passed in URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setFormData((prev) => ({ ...prev, category_id: categoryFromUrl }));
    }
  }, [searchParams]);

  // Stable callback to prevent WysiwygEditor re-renders
  const handleContentChange = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  }, []);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, title: e.target.value }));
    },
    []
  );

  const handleCategoryChange = useCallback((category_id: string) => {
    setFormData((prev) => ({ ...prev, category_id }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Enhanced validation for anonymous users - RATE LIMITS REMOVED
    if (!user) {
      // Still check for spam content but remove rate limiting
      const contentAnalysis = await spamDetection.analyzeContent(
        formData.content,
        "topic"
      );
      if (!contentAnalysis.allowed) {
        setContentErrors([
          contentAnalysis.message || "Content flagged as spam",
        ]);
        toast({
          title: "Content Blocked",
          description: contentAnalysis.message,
          variant: "destructive",
        });
        return;
      }

      // Legacy validation as fallback
      const validation = tempUser.validateContent(formData.content);
      if (!validation.isValid) {
        setContentErrors(validation.errors);
        toast({
          title: "Content not allowed",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }
      setContentErrors([]);
    }

    try {
      const topic = await createTopicMutation.mutateAsync(formData);

      // Record post and refresh rate limit for anonymous users
      if (!user) {
        await tempUser.recordPost();
        await tempUser.refreshRateLimit();
      }

      toast({
        title: "Success",
        description: "Topic created successfully!",
      });
      // Navigate using slug-based URL if available, fallback to UUID
      if (topic.slug && topic.categories?.slug) {
        // Use non-null assertion for topic.categories.slug as it's checked in the if condition
        router.push(`/category/${topic.categories!.slug}/${topic.slug}`);
      } else {
        router.push(`/topic/${topic.id}`);
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create topic. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCreatePoll = async (pollData: CreatePollData) => {
    // Now correctly typed as CreatePollData
    // First create the topic
    if (!formData.title || !formData.content || !formData.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required topic fields first",
        variant: "destructive",
      });
      return;
    }

    try {
      const topic = await createTopicMutation.mutateAsync(formData);

      // Then create the poll
      await createPollMutation.mutateAsync({
        topicId: topic.id,
        pollData,
      });

      toast({
        title: "Success",
        description: "Topic and poll created successfully!",
      });

      // Navigate to the topic
      if (topic.slug && topic.categories?.slug) {
        // Use non-null assertion for topic.categories.slug as it's checked in the if condition
        router.push(`/category/${topic.categories!.slug}/${topic.slug}`);
      } else {
        router.push(`/topic/${topic.id}`);
      }
    } catch (error) {
      console.error("Error creating topic with poll:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create topic with poll. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Create New Topic</h1>
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
        </div>
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-sm text-gray-600">Loading...</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create New Topic</h1>
        <Button variant="outline" onClick={() => router.push("/")}>
          Cancel
        </Button>
      </div>

      {/* DEBUG: Show auth state */}
      <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-md">
        <div className="text-sm">
          <strong>Debug Auth State:</strong>{" "}
          {JSON.stringify({ user: !!user, loading, userId: user?.id })}
        </div>
      </div>

      {/* Show temp user notice for non-authenticated users */}
      {!user && tempUser.tempUser && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <div className="font-medium">Posting as: Guest</div>
            <div className="text-xs mt-2 text-blue-600">
              <Link href="/register" className="underline hover:no-underline">
                Create account for additional features like images and links
              </Link>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Topic Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your topic"
              value={formData.title}
              onChange={handleTitleChange}
              required
            />
          </div>

          <SmartCategorySelector
            value={formData.category_id}
            onChange={handleCategoryChange}
            currentCategoryId={searchParams.get("category") || undefined}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <WysiwygEditor
              value={formData.content}
              onChange={handleContentChange}
              placeholder={
                user
                  ? "Write your topic content here..."
                  : "Write your topic content here (no images or links allowed for anonymous users)..."
              }
              height={300}
              allowImages={!!user}
              hideToolbar={!user}
            />
            {contentErrors.length > 0 && (
              <div className="text-sm text-red-600">
                <ul className="list-disc list-inside">
                  {contentErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Poll creation section - only for registered users */}
          {user && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="add-poll"
                  checked={showPollCreator}
                  onCheckedChange={setShowPollCreator}
                />
                <Label htmlFor="add-poll">Add a poll to this topic</Label>
              </div>
              {showPollCreator && (
                <PollCreator
                  onCreatePoll={handleCreatePoll} // This prop now expects CreatePollData
                  onCancel={() => setShowPollCreator(false)}
                  isLoading={
                    createTopicMutation.isPending ||
                    createPollMutation.isPending
                  }
                />
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            {showPollCreator ? (
              <Button
                type="button"
                onClick={() => {
                  if (
                    formData.title &&
                    formData.content &&
                    formData.category_id
                  ) {
                    // Poll creation is handled in PollCreator component
                    // No direct action needed here, as PollCreator calls handleCreatePoll
                    // when its internal form is submitted.
                  } else {
                    toast({
                      title: "Error",
                      description: "Please fill in all required fields",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={
                  createTopicMutation.isPending || createPollMutation.isPending
                }
              >
                {createTopicMutation.isPending || createPollMutation.isPending
                  ? "Creating..."
                  : "Create Topic with Poll"}
              </Button>
            ) : (
              <Button type="submit" disabled={createTopicMutation.isPending}>
                {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};
