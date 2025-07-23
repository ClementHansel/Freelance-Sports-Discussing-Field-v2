"use client";

import React, { useState, useEffect } from "react";
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
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTopic } from "@/hooks/useCreateTopic";
import { useTempUser } from "@/hooks/useTempUser";
import { useCategoryById, useCategories } from "@/hooks/useCategories";
import { HierarchicalCategorySelector } from "./HierarchicalCategorySelector";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define the Category interface based on the actual data structure from your hooks
// The 'description' field is explicitly 'string | null' as per the TypeScript error.
interface Category {
  id: string;
  name: string;
  color: string;
  description: string | null; // Corrected: can be string or null
  level: number;
  parent_category_id?: string;
  slug?: string;
}

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
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: preselectedCategoryId || "",
  });
  const [contentErrors, setContentErrors] = useState<string[]>([]);

  const createTopicMutation = useCreateTopic();
  const tempUser = useTempUser();

  // Fetch data for the currently selected category (formData.category_id)
  const { data: currentSelectedCategory } = useCategoryById(
    formData.category_id || ""
  );

  // Fetch all categories to derive the breadcrumb path
  const { data: allLevel1Categories } = useCategories(null, 1);
  const { data: allLevel2Categories } = useCategories(undefined, 2);

  // Derived state for breadcrumbs based on formData.category_id
  const [level1Category, setLevel1Category] = useState<Category | null>(null);
  const [level2Category, setLevel2Category] = useState<Category | null>(null);
  const [level3Category, setLevel3Category] = useState<Category | null>(null);

  useEffect(() => {
    if (currentSelectedCategory && allLevel1Categories && allLevel2Categories) {
      let l1Cat: Category | null = null;
      let l2Cat: Category | null = null;
      let l3Cat: Category | null = null;

      // Type assertions are used here to ensure the data from hooks conforms to our Category interface
      // This is safe because we are correcting the interface to match the hook's return type.
      const currentCat: Category = currentSelectedCategory as Category;
      const l1Cats: Category[] = allLevel1Categories as Category[];
      const l2Cats: Category[] = allLevel2Categories as Category[];

      if (currentCat.level === 3) {
        l3Cat = currentCat;
        const parent2 = l2Cats.find(
          (cat: Category) => cat.id === currentCat.parent_category_id
        );
        if (parent2) {
          l2Cat = parent2;
          const parent1 = l1Cats.find(
            (cat: Category) => cat.id === parent2.parent_category_id
          );
          if (parent1) {
            l1Cat = parent1;
          }
        }
      } else if (currentCat.level === 2) {
        l2Cat = currentCat;
        const parent1 = l1Cats.find(
          (cat: Category) => cat.id === currentCat.parent_category_id
        );
        if (parent1) {
          l1Cat = parent1;
        }
      } else if (currentCat.level === 1) {
        l1Cat = currentCat;
      }

      // Only update state if there's a change to prevent unnecessary re-renders
      if (
        l1Cat?.id !== level1Category?.id ||
        l2Cat?.id !== level2Category?.id ||
        l3Cat?.id !== level3Category?.id
      ) {
        setLevel1Category(l1Cat);
        setLevel2Category(l2Cat);
        setLevel3Category(l3Cat);
      }
    } else if (!formData.category_id) {
      // Clear breadcrumbs if no category is selected
      if (level1Category || level2Category || level3Category) {
        setLevel1Category(null);
        setLevel2Category(null);
        setLevel3Category(null);
      }
    }
  }, [
    formData.category_id,
    currentSelectedCategory,
    allLevel1Categories,
    allLevel2Categories,
    level1Category, // Include current state in dependencies for comparison
    level2Category,
    level3Category,
  ]);

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
        router.push(`/category/${topic.categories.slug}/${topic.slug}`);
      } else {
        router.push(`/topic/${topic.id}`);
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
      <DialogTrigger asChild>
        {React.isValidElement(trigger) ? trigger : defaultTrigger}
      </DialogTrigger>
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
                  Create account for unlimited posting + images/links
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Show current forum selection when any category is selected */}
        {(level1Category || level2Category || level3Category) && (
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
