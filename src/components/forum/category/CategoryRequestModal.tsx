// src/components/forum/category/CategoryRequestModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
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
import { useTempUser } from "@/hooks/useTempUser";
import { useCategoryById, useCategories } from "@/hooks/useCategories";

import { toast, useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { HierarchicalCategorySelector } from "../HierarchicalCategorySelector";
import { useCreateCategoryRequest } from "@/hooks/useCategoryRequests";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Define the Category interface based on the actual data structure from your hooks
interface Category {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  level: number;
  parent_category_id: string | null;
  slug: string;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  requires_moderation: boolean | null;
  canonical_url: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  meta_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_title: string | null;
}

// --- Interfaces for joined data ---
interface CategoryJoin {
  name: string;
  id: string;
  slug: string;
}

interface ProfileJoin {
  username: string;
  id: string;
}

export interface CategoryRequest {
  id: string;
  name: string;
  description: string;
  justification: string;
  status: "pending" | "approved" | "rejected";
  requested_by_user_id: string | null;
  requester_display_name: string | null;
  parent_category_id: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: CategoryJoin;
  profiles?: ProfileJoin;
}

// CORRECTED: This interface now matches the CreateCategoryRequestData in useCategoryRequests.ts
// It does NOT include requested_by_user_id or requester_display_name, as those are handled by the hook.
interface CreateCategoryRequestDataForMutation {
  name: string;
  description: string;
  justification: string;
  parentCategoryId?: string | null; // Matches the name in useCategoryRequests.ts
}

interface UpdateCategoryRequestData {
  id: string;
  status?: "pending" | "approved" | "rejected";
  adminNotes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

interface CategoryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParentCategoryId?: string | null;
  trigger?: React.ReactNode;
}

// Zod schema for validation (this still uses parent_category_id for internal form state)
const categoryRequestSchema = z.object({
  name: z.string().min(3, "Category name must be at least 3 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(500, "Description cannot exceed 500 characters."),
  justification: z
    .string()
    .min(10, "Justification must be at least 10 characters.")
    .max(500, "Justification cannot exceed 500 characters."),
  parent_category_id: z.string().nullable().optional(), // This is for RHF internal state
});

type CategoryRequestFormData = z.infer<typeof categoryRequestSchema>;

export const CategoryRequestModal: React.FC<CategoryRequestModalProps> = ({
  isOpen,
  onClose,
  initialParentCategoryId,
  trigger,
}) => {
  const { user } = useAuth();
  const { tempUser, canPost } = useTempUser();
  const { toast } = useToast();
  const router = useRouter();

  const createCategoryRequestMutation = useCreateCategoryRequest();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryRequestFormData>({
    resolver: zodResolver(categoryRequestSchema),
    defaultValues: {
      name: "",
      description: "",
      justification: "",
      parent_category_id: initialParentCategoryId || null,
    },
  });

  const formData = watch();

  useEffect(() => {
    reset({
      name: "",
      description: "",
      justification: "",
      parent_category_id: initialParentCategoryId || null,
    });
  }, [isOpen, initialParentCategoryId, reset]);

  const onSubmit = async (data: CategoryRequestFormData) => {
    const contentErrors: string[] = [];
    if (!user) {
      const parser = new DOMParser();
      const descriptionDoc = parser.parseFromString(
        data.description,
        "text/html"
      );
      const justificationDoc = parser.parseFromString(
        data.justification,
        "text/html"
      );

      if (
        descriptionDoc.querySelectorAll("a").length > 0 ||
        justificationDoc.querySelectorAll("a").length > 0
      ) {
        contentErrors.push(
          "Anonymous users cannot include links in description or justification."
        );
      }
      if (
        descriptionDoc.querySelectorAll("img").length > 0 ||
        justificationDoc.querySelectorAll("img").length > 0
      ) {
        contentErrors.push(
          "Anonymous users cannot include images in description or justification."
        );
      }
    }

    if (contentErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: contentErrors.join(" "),
        variant: "destructive",
      });
      return;
    }

    if (!user && !tempUser?.id) {
      toast({
        title: "Authentication Required",
        description:
          "Please log in or create a temporary user to submit a category request.",
        variant: "destructive",
      });
      return;
    }

    try {
      // CORRECTED: Create an object that matches the CreateCategoryRequestData in useCategoryRequests.ts
      const mutationPayload: CreateCategoryRequestDataForMutation = {
        name: data.name,
        description: data.description,
        justification: data.justification,
        parentCategoryId: data.parent_category_id, // Map from RHF's parent_category_id to mutation's parentCategoryId
      };

      await createCategoryRequestMutation.mutateAsync(mutationPayload);

      toast({
        title: "Request Submitted",
        description: "Your category request has been submitted for review.",
      });
      onClose();
      reset();
    } catch (error) {
      console.error("Error submitting category request:", error);
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a New Category</DialogTitle>
          <DialogDescription>
            Suggest a new category for the forum. Your request will be reviewed
            by administrators.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., U11 Competitive Hockey"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <WysiwygEditor
              value={formData.description}
              onChange={(value) =>
                setValue("description", value, { shouldValidate: true })
              }
              placeholder="A brief description of the category's purpose..."
              height={150}
              allowImages={!!user}
              hideToolbar={!user}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification</Label>
            <WysiwygEditor
              value={formData.justification}
              onChange={(value) =>
                setValue("justification", value, { shouldValidate: true })
              }
              placeholder="Why is this category needed? What topics will it cover?"
              height={150}
              allowImages={!!user}
              hideToolbar={!user}
            />
            {errors.justification && (
              <p className="text-red-500 text-xs mt-1">
                {errors.justification.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Parent Category (Optional)</Label>
            <HierarchicalCategorySelector
              value={formData.parent_category_id || ""}
              onChange={(value) =>
                setValue("parent_category_id", value === "" ? null : value, {
                  shouldValidate: true,
                })
              }
              preselectedCategoryId={initialParentCategoryId ?? undefined}
            />
            {errors.parent_category_id && (
              <p className="text-red-500 text-xs mt-1">
                {errors.parent_category_id.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!user && !canPost)}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
