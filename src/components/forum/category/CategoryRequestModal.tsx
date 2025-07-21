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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateCategoryRequest } from "@/hooks/useCategoryRequests";

interface CategoryRequestModalProps {
  currentCategoryId?: string;
  trigger?: React.ReactNode;
}

export const CategoryRequestModal = ({
  currentCategoryId,
  trigger,
}: CategoryRequestModalProps) => {
  const [open, setOpen] = useState(false);
  const createRequest = useCreateCategoryRequest();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentCategoryId: currentCategoryId || "",
    justification: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createRequest.mutateAsync({
      name: formData.name,
      description: formData.description,
      justification: formData.justification,
      parentCategoryId: formData.parentCategoryId || undefined,
    });

    setOpen(false);
    setFormData({
      name: "",
      description: "",
      parentCategoryId: currentCategoryId || "",
      justification: "",
    });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Request Category
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g., U15 AA League"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this category would be for..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Why is this category needed?</Label>
            <Textarea
              id="justification"
              placeholder="Explain why this category would be valuable to the community..."
              value={formData.justification}
              onChange={(e) =>
                setFormData({ ...formData, justification: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
