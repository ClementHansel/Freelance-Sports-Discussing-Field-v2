// src\components\forum\category\SmartCategorySelector.tsx
"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useCategories";

interface SmartCategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  currentCategoryId?: string;
  required?: boolean;
}

export const SmartCategorySelector = ({
  value,
  onChange,
  currentCategoryId,
  required = false,
}: SmartCategorySelectorProps) => {
  // Get Level 3 categories (the ones that can have topics)
  // FIXED: Pass level as a property within the single argument object
  const { data: level3Categories, isLoading } = useCategories({ level: 3 });

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select value={value} onValueChange={onChange} required={required}>
        <SelectTrigger>
          <SelectValue placeholder="Select a category for your topic" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Loading categories...
            </SelectItem>
          ) : (
            level3Categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    // FIXED: Provide a fallback empty string if category.color is null
                    style={{ backgroundColor: category.color ?? "" }}
                  />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
