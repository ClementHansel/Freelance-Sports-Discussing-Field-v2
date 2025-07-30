// src\components\forum\HierarchicalCategorySelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useCategories, useCategoryById } from "@/hooks/useCategories";
import { Card, CardContent } from "@/components/ui/card";

// Define the Category interface based on the actual data structure from your hooks
// The 'description' field is explicitly 'string | null' as per the TypeScript error.
interface Category {
  id: string;
  name: string;
  color: string | null; // Corrected: color can be string or null
  description: string | null; // Corrected: can be string or null
  level: number;
  parent_category_id?: string;
  slug?: string;
}

interface HierarchicalCategorySelectorProps {
  value: string; // The currently selected category ID from the parent (should be level 3)
  onChange: (value: string) => void; // Callback to update parent's selected category ID
  preselectedCategoryId?: string; // Initial hint for category ID (used for initial parent state)
  required?: boolean;
}

export const HierarchicalCategorySelector = ({
  value,
  onChange,
  preselectedCategoryId,
  required = false,
}: HierarchicalCategorySelectorProps) => {
  // Internal state to manage the navigation steps within the selector
  const [selectedLevel1, setSelectedLevel1] = useState<string>("");
  const [selectedLevel2, setSelectedLevel2] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Fetch category data for the current 'value' prop (controlled by parent)
  // Assuming useCategoryById takes only the ID
  const { data: currentCategoryFromValue } = useCategoryById(value || "");

  // Fetch categories for each level using the assumed object-based argument
  const { data: level1Categories } = useCategories({ level: 1 });
  const { data: level2Categories } = useCategories({
    parentId: selectedLevel1 || undefined,
    level: 2,
  });
  const { data: level3Categories } = useCategories({
    parentId: selectedLevel2 || undefined,
    level: 3,
  });
  // Fetch all level 2 categories for path resolution when syncing with 'value'
  const { data: allLevel2Categories } = useCategories({ level: 2 });

  /**
   * Effect to synchronize internal path state with the 'value' prop from the parent.
   * This ensures the component's internal navigation reflects the controlled 'value'.
   * It runs when 'value' changes or when the necessary category data becomes available.
   * IMPORTANT: 'selectedLevel1', 'selectedLevel2', 'step' are NOT in dependencies to prevent loop.
   */

  useEffect(() => {
    // Only proceed if 'value' is present and its corresponding category data is loaded
    if (
      value &&
      currentCategoryFromValue &&
      level1Categories &&
      allLevel2Categories
    ) {
      let newLevel1 = "";
      let newLevel2 = "";
      let newStep: 1 | 2 | 3 = 1;

      // Type assertions to ensure data from hooks conforms to our Category interface
      const currentCat: Category = currentCategoryFromValue as Category;
      const l1Cats: Category[] = level1Categories as Category[];
      const l2Cats: Category[] = allLevel2Categories as Category[]; // Use allLevel2Categories for finding parents

      // Determine the hierarchical path based on the current 'value'
      if (currentCat.level === 3) {
        const parent2 = l2Cats.find(
          (cat) => cat.id === currentCat.parent_category_id
        );
        if (parent2) {
          newLevel2 = parent2.id;
          const parent1 = l1Cats.find(
            (cat) => cat.id === parent2.parent_category_id
          );
          if (parent1) {
            newLevel1 = parent1.id;
          }
        }
        newStep = 3;
      } else if (currentCat.level === 2) {
        newLevel2 = currentCat.id;
        const parent1 = l1Cats.find(
          (cat) => cat.id === currentCat.parent_category_id
        );
        if (parent1) {
          newLevel1 = parent1.id;
        }
        newStep = 3; // If a level 2 is selected, we move to step 3 to show its children
      } else if (currentCat.level === 1) {
        newLevel1 = currentCat.id;
        newStep = 2; // If a level 1 is selected, we move to step 2 to show its children
      }

      // Only update internal state if it's genuinely different from the derived path
      // This prevents unnecessary re-renders when the state is already correct.
      if (
        newLevel1 !== selectedLevel1 ||
        newLevel2 !== selectedLevel2 ||
        newStep !== step
      ) {
        setSelectedLevel1(newLevel1);
        setSelectedLevel2(newLevel2);
        setStep(newStep);
      }
    } else if (!value && (selectedLevel1 || selectedLevel2 || step !== 1)) {
      // If 'value' is cleared by the parent, reset internal state to step 1
      setSelectedLevel1("");
      setSelectedLevel2("");
      setStep(1);
    }
  }, [
    value, // Trigger when the controlled 'value' prop changes
    currentCategoryFromValue, // Trigger when the category object for 'value' loads/changes
    level1Categories, // Trigger when level 1 categories load/change
    allLevel2Categories, // Trigger when all level 2 categories load/change
    // selectedLevel1, selectedLevel2, step are intentionally omitted here as the
    // effect updates them, and an internal check prevents infinite loops.
  ]);

  /**
   * Handles selection of a level 1 category.
   * Updates internal state to move to step 2. Does NOT call onChange.
   */
  const handleLevel1Select = (categoryId: string) => {
    setSelectedLevel1(categoryId);
    setSelectedLevel2(""); // Reset level 2 selection
    onChange(""); // Clear parent's selected category until a level 3 is chosen
    setStep(2);
  };

  /**
   * Handles selection of a level 2 category.
   * Updates internal state to move to step 3. Does NOT call onChange.
   */
  const handleLevel2Select = (categoryId: string) => {
    setSelectedLevel2(categoryId);
    onChange(""); // Clear parent's selected category until a level 3 is chosen
    setStep(3);
  };

  /**
   * Handles selection of a level 3 category (the final selection).
   * Calls onChange to update the parent's selected category ID.
   */
  const handleLevel3Select = (categoryId: string) => {
    onChange(categoryId); // This is the final selection, update parent
  };

  /**
   * Handles navigating back a step in the hierarchy.
   * Updates internal state. If navigating back from a level 3 selection,
   * it also clears the parent's selected category (`value`).
   */
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedLevel1("");
      onChange(""); // Clear parent's selection if going back from L1 to L0
    } else if (step === 3) {
      setStep(2);
      setSelectedLevel2("");
      onChange(""); // Clear parent's selection if going back from L2 to L1
    }
  };

  /**
   * Returns the categories to display for the current step.
   */
  const getCurrentLevelCategories = () => {
    switch (step) {
      case 1:
        return level1Categories ?? [];
      case 2:
        return level2Categories ?? [];
      case 3:
        return level3Categories ?? [];
      default:
        return [];
    }
  };

  /**
   * Returns the title for the current selection step.
   */
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

  // The category object to display in the "Selected:" section, derived from the 'value' prop
  const selectedCategoryToDisplay = currentCategoryFromValue;

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
              else handleLevel3Select(category.id); // Only call onChange for final selection
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color ?? "transparent" }} // Added fallback
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

      {selectedCategoryToDisplay && (
        <div className="p-3 bg-muted rounded-md">
          <div className="text-sm font-medium text-foreground">Selected:</div>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  selectedCategoryToDisplay.color ?? "transparent",
              }} // Added fallback
            />
            <span className="text-sm text-foreground">
              {selectedCategoryToDisplay.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
