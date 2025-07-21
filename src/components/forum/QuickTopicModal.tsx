"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink, // This might need to be Link from next/link if it's not purely presentational
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTopic } from "@/hooks/useCreateTopic";
import { useTempUser } from "@/hooks/useTempUser";
import { useCategoryById } from "@/hooks/useCategories";
import { HierarchicalCategorySelector } from "./HierarchicalCategorySelector";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QuickTopicModalProps {
  preselectedCategoryId?: string;
  trigger?: React.ReactNode;
  size?: "sm" | "default" | "lg";
}

export const QuickTopicModal = ({
  preselectedCategoryId,
  trigger,
  size = "default",
}: QuickTopicModalProps) => {
  const router = useRouter(); // Initialize useRouter
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: preselectedCategoryId || "",
  });
  const [contentErrors, setContentErrors] = useState<string[]>([]);
  const [navigationPath, setNavigationPath] = useState({
    level1Id: "",
    level2Id: "",
    level3Id: "",
  });

  const createTopicMutation = useCreateTopic();
  const tempUser = useTempUser(); // Assuming useTempUser is a client-side hook
  const { data: currentSelectedCategory } = useCategoryById(
    formData.category_id || preselectedCategoryId || ""
  );

  // Get category data for breadcrumb path
  const { data: level1Category } = useCategoryById(navigationPath.level1Id);
  const { data: level2Category } = useCategoryById(navigationPath.level2Id);
  const { data: level3Category } = useCategoryById(navigationPath.level3Id);

  const handlePathChange = (path: {
    level1Id: string;
    level2Id: string;
    level3Id: string;
  }) => {
    setNavigationPath(path);
  };

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

    // Validate content for anonymous users
    if (!user) {
      if (!tempUser.canPost) {
        toast({
          title: "Rate limit exceeded",
          description:
            "You've reached the limit of 5 posts per 12 hours for anonymous users",
          variant: "destructive",
        });
        return;
      }

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

      // Refresh rate limit for anonymous users
      if (!user) {
        await tempUser.refreshRateLimit();
      }

      toast({
        title: "Success",
        description: "Topic created successfully!",
      });

      setOpen(false);
      setFormData({
        title: "",
        content: "",
        category_id: preselectedCategoryId || "",
      });

      // Navigate using slug-based URL if available, fallback to UUID
      if (topic.slug && topic.categories?.slug) {
        router.push(`/category/${topic.categories.slug}/${topic.slug}`); // Use router.push
      } else {
        router.push(`/topic/${topic.id}`); // Use router.push
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      toast({
        title: "Error",
        description: "Failed to create topic. Please try again.",
        variant: "destructive",
      });
    }
  };

  const defaultTrigger = (
    <Button size={size}>
      <Plus className="h-4 w-4 mr-2" />
      New Topic
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Create New Topic</span>
          </DialogTitle>
        </DialogHeader>

        {/* Show temp user notice for non-authenticated users */}
        {!user && tempUser.tempUser && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Posting as: Guest</div>
              <div className="text-xs mt-1">
                {tempUser.canPost
                  ? `${tempUser.remainingPosts} posts remaining in the next 12 hours`
                  : "Rate limit reached (5 posts per 12 hours)"}
              </div>
              <div className="text-xs mt-2 text-blue-600">
                <Link href="/register" className="underline hover:no-underline">
                  {" "}
                  {/* Changed 'a' to 'Link' */}
                  Create account for unlimited posting + images/links
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Show current forum selection when any category is selected */}
        {(level1Category ||
          level2Category ||
          level3Category ||
          (formData.category_id && currentSelectedCategory)) && (
          <div className="bg-muted/50 p-3 rounded-md border w-full overflow-hidden">
            <div className="text-sm text-muted-foreground mb-2">
              Posting in:
            </div>
            <Breadcrumb className="overflow-hidden">
              <BreadcrumbList className="flex-wrap">
                {/* Show navigation path if it exists */}
                {level1Category && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="flex items-center gap-2 truncate">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: level1Category.color }}
                        />
                        <span className="truncate">{level1Category.name}</span>
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {(level2Category || level3Category) && (
                      <BreadcrumbSeparator />
                    )}
                  </>
                )}
                {level2Category && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="flex items-center gap-2 truncate">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: level2Category.color }}
                        />
                        <span className="truncate">{level2Category.name}</span>
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {level3Category && <BreadcrumbSeparator />}
                  </>
                )}
                {level3Category && (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-2 font-semibold truncate">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: level3Category.color }}
                      />
                      <span className="truncate">{level3Category.name}</span>
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                )}
                {/* Fallback for when final category is selected but no navigation path */}
                {!level1Category &&
                  !level2Category &&
                  !level3Category &&
                  formData.category_id &&
                  currentSelectedCategory && (
                    <BreadcrumbItem>
                      <BreadcrumbPage className="flex items-center gap-2 font-semibold truncate">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: currentSelectedCategory.color,
                          }}
                        />
                        <span className="truncate">
                          {currentSelectedCategory.name}
                        </span>
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="text-xs text-muted-foreground mt-2">
              You can change the forum selection below if needed
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 w-full max-w-full overflow-hidden"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Topic Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your topic"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <WysiwygEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder={
                user
                  ? "Write your topic content here..."
                  : "Write your topic content here (no images or links allowed for anonymous users)..."
              }
              height={200}
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

          <HierarchicalCategorySelector
            value={formData.category_id}
            onChange={(value) =>
              setFormData({ ...formData, category_id: value })
            }
            preselectedCategoryId={preselectedCategoryId}
            onPathChange={handlePathChange}
            required
          />

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createTopicMutation.isPending || (!user && !tempUser.canPost)
              }
              className="w-full sm:w-auto"
            >
              {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
