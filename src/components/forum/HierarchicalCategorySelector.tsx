"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useCategories, useCategoryById } from "@/hooks/useCategories";
import { Card, CardContent } from "@/components/ui/card";

interface HierarchicalCategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  preselectedCategoryId?: string;
  required?: boolean;
  onPathChange?: (path: {
    level1Id: string;
    level2Id: string;
    level3Id: string;
  }) => void;
}

export const HierarchicalCategorySelector = ({
  value,
  onChange,
  preselectedCategoryId,
  required = false,
  onPathChange,
}: HierarchicalCategorySelectorProps) => {
  const [selectedLevel1, setSelectedLevel1] = useState<string>("");
  const [selectedLevel2, setSelectedLevel2] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Get preselected category data to initialize the selector
  const { data: preselectedCategory } = useCategoryById(
    preselectedCategoryId || ""
  );

  // Get categories for each level
  const { data: level1Categories } = useCategories(null, 1);
  const { data: level2Categories } = useCategories(
    selectedLevel1 || undefined,
    2
  );
  const { data: level3Categories } = useCategories(
    selectedLevel2 || undefined,
    3
  );

  // Also get all level 2 and 3 categories to find parent relationships
  const { data: allLevel2Categories } = useCategories(undefined, 2);
  const { data: allLevel3Categories } = useCategories(undefined, 3);

  // Initialize with preselected category
  useEffect(() => {
    if (
      preselectedCategoryId &&
      preselectedCategory &&
      level1Categories &&
      allLevel2Categories
    ) {
      // Set the value immediately
      onChange(preselectedCategoryId);

      // Handle different category levels
      if (preselectedCategory.level === 1) {
        // Level 1 category - set as level 1 selection
        setSelectedLevel1(preselectedCategory.id);
        setStep(2);
      } else if (
        preselectedCategory.level === 2 &&
        preselectedCategory.parent_category_id
      ) {
        // Level 2 category - find parent and set both levels
        const level1Parent = level1Categories.find(
          (cat) => cat.id === preselectedCategory.parent_category_id
        );
        if (level1Parent) {
          setSelectedLevel1(level1Parent.id);
          setSelectedLevel2(preselectedCategory.id);
          setStep(3);
        }
      } else if (
        preselectedCategory.level === 3 &&
        preselectedCategory.parent_category_id
      ) {
        // Level 3 category - find the parent chain
        const level2Parent = allLevel2Categories.find(
          (cat) => cat.id === preselectedCategory.parent_category_id
        );
        if (level2Parent && level2Parent.parent_category_id) {
          const level1Parent = level1Categories.find(
            (cat) => cat.id === level2Parent.parent_category_id
          );

          if (level1Parent) {
            setSelectedLevel1(level1Parent.id);
            setSelectedLevel2(level2Parent.id);
            setStep(3);
          }
        }
      }
    }
  }, [
    preselectedCategoryId,
    preselectedCategory,
    level1Categories,
    allLevel2Categories,
    onChange,
  ]);

  // Notify parent of path changes
  useEffect(() => {
    if (onPathChange) {
      onPathChange({
        level1Id: selectedLevel1,
        level2Id: selectedLevel2,
        level3Id: value,
      });
    }
  }, [selectedLevel1, selectedLevel2, value, onPathChange]);

  const handleLevel1Select = (categoryId: string) => {
    setSelectedLevel1(categoryId);
    setSelectedLevel2("");
    onChange("");
    setStep(2);
  };

  const handleLevel2Select = (categoryId: string) => {
    setSelectedLevel2(categoryId);
    onChange("");
    setStep(3);
  };

  const handleLevel3Select = (categoryId: string) => {
    onChange(categoryId);
    // Immediately update the path with the level 3 selection
    if (onPathChange) {
      onPathChange({
        level1Id: selectedLevel1,
        level2Id: selectedLevel2,
        level3Id: categoryId,
      });
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedLevel1("");
    } else if (step === 3) {
      setStep(2);
      setSelectedLevel2("");
      onChange("");
    }
  };

  const getCurrentLevelCategories = () => {
    switch (step) {
      case 1:
        return level1Categories || [];
      case 2:
        return level2Categories || [];
      case 3:
        return level3Categories || [];
      default:
        return [];
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Select Main Forum";
      case 2:
        return "Select Region/Tournament";
      case 3:
        return "Select Age Group & Skill Level";
      default:
        return "Select Category";
    }
  };

  const selectedCategory =
    value && preselectedCategory?.id === value
      ? preselectedCategory
      : level3Categories?.find((cat) => cat.id === value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="category" className="text-base font-medium">
          {getStepTitle()}
        </Label>
        {step > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex space-x-2">
        {[1, 2, 3].map((stepNum) => (
          <div
            key={stepNum}
            className={`h-2 flex-1 rounded-full ${
              stepNum <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Category selection */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {getCurrentLevelCategories().map((category) => (
          <Card
            key={category.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              step === 3 && value === category.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => {
              if (step === 1) handleLevel1Select(category.id);
              else if (step === 2) handleLevel2Select(category.id);
              else handleLevel3Select(category.id);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <div className="font-medium text-sm">{category.name}</div>
                    {category.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </div>
                    )}
                  </div>
                </div>
                {step < 3 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected category display */}
      {selectedCategory && (
        <div className="p-3 bg-muted rounded-md">
          <div className="text-sm font-medium text-foreground">Selected:</div>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <span className="text-sm text-foreground">
              {selectedCategory.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
