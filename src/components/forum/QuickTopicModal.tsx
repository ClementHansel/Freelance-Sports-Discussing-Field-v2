// src/components/forum/QuickTopicModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // Added DialogDescription for better accessibility/context
  DialogFooter, // Added DialogFooter for button grouping
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
import {
  useCategoryById,
  useCategories,
  Category, // Canonical Category type
} from "@/hooks/useCategories";
import { HierarchicalCategorySelector } from "./HierarchicalCategorySelector";
import { toast, useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod"; // Added Zod for validation
import { zodResolver } from "@hookform/resolvers/zod"; // Added Zod Resolver
import { useForm } from "react-hook-form"; // Added React Hook Form

// Define the schema for the form using Zod
const topicFormSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters.")
    .max(100, "Title cannot exceed 100 characters."),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters.")
    .max(5000, "Content cannot exceed 5000 characters."),
  category_id: z.string().min(1, "Category is required."),
});

type TopicFormData = z.infer<typeof topicFormSchema>;

// Re-introduced 'trigger', 'size', 'isOpen', 'onClose' to props
interface QuickTopicModalProps {
  preselectedCategoryId?: string;
  isOpen: boolean; // Controlled prop for dialog visibility
  onClose: () => void; // Controlled prop to close the dialog
}

export const QuickTopicModal = ({
  preselectedCategoryId,
  isOpen, // Destructure isOpen
  onClose, // Destructure onClose
}: QuickTopicModalProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const createTopicMutation = useCreateTopic();
  const tempUser = useTempUser();
  const { toast } = useToast(); // Ensure toast is imported and used

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TopicFormData>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category_id: preselectedCategoryId || "",
    },
  });

  // Watch form fields
  const formData = watch(); // This will give you the current form data

  // Sync preselectedCategoryId with form state when it changes
  useEffect(() => {
    if (
      preselectedCategoryId &&
      preselectedCategoryId !== formData.category_id
    ) {
      setValue("category_id", preselectedCategoryId);
    }
  }, [preselectedCategoryId, setValue, formData.category_id]);

  // Fetch category details for breadcrumbs
  const { data: currentSelectedCategory } = useCategoryById(
    formData.category_id || "",
    { enabled: !!formData.category_id } // Only fetch if category_id exists
  );

  const { data: allLevel1Categories } = useCategories({
    level: 1,
    enabled: isOpen,
  });
  const { data: allLevel2Categories } = useCategories({
    level: 2,
    enabled: isOpen,
  });
  const { data: allLevel3Categories } = useCategories({
    level: 3,
    enabled: isOpen,
  }); // Also fetch level 3 for breadcrumb lookup

  const [level1Category, setLevel1Category] = useState<Category | null>(null);
  const [level2Category, setLevel2Category] = useState<Category | null>(null);
  const [level3Category, setLevel3Category] = useState<Category | null>(null);

  // Effect to build breadcrumb categories based on selected category
  useEffect(() => {
    if (
      currentSelectedCategory &&
      allLevel1Categories &&
      allLevel2Categories &&
      allLevel3Categories
    ) {
      const currentCat: Category = currentSelectedCategory;
      const allCats: Category[] = [
        ...allLevel1Categories,
        ...allLevel2Categories,
        ...allLevel3Categories,
      ];

      let l1Cat: Category | null = null;
      let l2Cat: Category | null = null;
      let l3Cat: Category | null = null;

      if (currentCat.level === 3) {
        l3Cat = currentCat;
        const parent2 = allCats.find(
          (cat) => cat.id === currentCat.parent_category_id
        );
        if (parent2) {
          l2Cat = parent2;
          const parent1 = allCats.find(
            (cat) => cat.id === parent2.parent_category_id
          );
          if (parent1) {
            l1Cat = parent1;
          }
        }
      } else if (currentCat.level === 2) {
        l2Cat = currentCat;
        const parent1 = allCats.find(
          (cat) => cat.id === currentCat.parent_category_id
        );
        if (parent1) {
          l1Cat = parent1;
        }
      } else if (currentCat.level === 1) {
        l1Cat = currentCat;
      }

      setLevel1Category(l1Cat);
      setLevel2Category(l2Cat);
      setLevel3Category(l3Cat);
    } else if (!formData.category_id) {
      // Clear breadcrumbs if no category is selected
      setLevel1Category(null);
      setLevel2Category(null);
      setLevel3Category(null);
    }
  }, [
    formData.category_id,
    currentSelectedCategory,
    allLevel1Categories,
    allLevel2Categories,
    allLevel3Categories, // Added dependency
  ]);

  const handleFormSubmit = async (data: TopicFormData) => {
    // Content validation for anonymous users
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

      const validation = tempUser.validateContent(data.content);
      if (!validation.isValid) {
        // setContentErrors(validation.errors); // No longer needed with RHF error handling
        toast({
          title: "Content not allowed",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }
      // setContentErrors([]); // No longer needed
    }

    try {
      const topic = await createTopicMutation.mutateAsync(data);

      if (!user) {
        await tempUser.refreshRateLimit();
      }

      toast({
        title: "Success",
        description: "Topic created successfully!",
      });

      onClose(); // Close the dialog on success using the controlled handler
      reset(); // Reset form fields

      // Navigate to the new topic
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

  // The default trigger button, used if no 'trigger' prop is provided
  const defaultTriggerButton = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      New Topic
    </Button>
  );

  return (
    // Dialog is now directly controlled by 'open' and 'onOpenChange'
    <Dialog open={isOpen} onOpenChange={onClose}>
      {" "}
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Create New Topic</span>
          </DialogTitle>
          <DialogDescription>
            Start a new discussion in the selected category.
          </DialogDescription>
        </DialogHeader>

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

        {(level1Category || level2Category || level3Category) && (
          <div className="bg-muted/50 p-3 rounded-md border w-full overflow-hidden">
            <div className="text-sm text-muted-foreground mb-2">
              Posting in:
            </div>
            <Breadcrumb className="overflow-hidden">
              <BreadcrumbList className="flex-wrap">
                {level1Category && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="flex items-center gap-2 truncate">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: level1Category.color ?? "",
                          }}
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
                          style={{
                            backgroundColor: level2Category.color ?? "",
                          }}
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
                        style={{ backgroundColor: level3Category.color ?? "" }}
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
          onSubmit={handleSubmit(handleFormSubmit)} // Use RHF handleSubmit
          className="space-y-4 w-full max-w-full overflow-hidden"
        >
          <div className="space-y-2">
            {" "}
            {/* Changed from space-y-4 */}
            <Label htmlFor="title">Topic Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your topic"
              {...register("title")} // Register with RHF
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <WysiwygEditor
              value={formData.content} // Use formData.content from watch
              onChange={(value) =>
                setValue("content", value, { shouldValidate: true })
              } // Update RHF state
              placeholder={
                user
                  ? "Write your topic content here..."
                  : "Write your topic content here (no images or links allowed for anonymous users)..."
              }
              height={200}
              allowImages={!!user}
              hideToolbar={!user}
            />
            {errors.content && ( // RHF handles content errors
              <div className="text-sm text-red-600">
                <ul className="list-disc list-inside">
                  <li>{errors.content.message}</li>
                </ul>
              </div>
            )}
          </div>

          <HierarchicalCategorySelector
            value={formData.category_id} // Use formData.category_id from watch
            onChange={(value) =>
              setValue("category_id", value, { shouldValidate: true })
            } // Update RHF state
            preselectedCategoryId={preselectedCategoryId} // Pass preselectedCategoryId
            required
          />
          {errors.category_id && (
            <p className="text-red-500 text-xs mt-1">
              {errors.category_id.message}
            </p>
          )}

          <DialogFooter>
            {" "}
            {/* Use DialogFooter for buttons */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()} // Use onClose prop
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!user && !tempUser.canPost)}
            >
              {isSubmitting ? "Creating..." : "Create Topic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
