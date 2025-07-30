// src\components\dashboard\admin\content\MoveTopicModal.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useMoveTopic } from "@/hooks/useMoveTopic";

interface MoveTopicModalProps {
  topic: {
    id: string;
    title: string;
    currentCategoryId: string;
    currentCategoryName: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MoveTopicModal = ({
  topic,
  isOpen,
  onClose,
}: MoveTopicModalProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  // Fetch level 1 categories (parent categories) by passing an options object
  const { data: level1Categories = [] } = useCategories({ level: 1 });
  // Fetch level 2 categories (child categories) by passing an options object
  const { data: level2Categories = [] } = useCategories({ level: 2 });

  const moveTopicMutation = useMoveTopic();

  const handleMove = async () => {
    if (!topic || !selectedCategoryId || !selectedCategoryName) return;

    await moveTopicMutation.mutateAsync({
      topicId: topic.id,
      newCategoryId: selectedCategoryId,
      currentCategoryName: topic.currentCategoryName,
      newCategoryName: selectedCategoryName,
    });

    onClose();
    setSelectedCategoryId("");
    setSelectedCategoryName("");
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);

    // Find the category name from both fetched lists
    const foundCategory =
      level1Categories.find((cat) => cat.id === value) ||
      level2Categories.find((cat) => cat.id === value);

    setSelectedCategoryName(foundCategory?.name || "");
  };

  // Group level 2 categories by their parent
  const groupedCategories = level2Categories.reduce((acc, category) => {
    const parentId = category.parent_category_id || "root"; // 'root' for categories without a parentId if needed
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(category);
    return acc;
  }, {} as Record<string, typeof level2Categories>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Topic</DialogTitle>
        </DialogHeader>

        {topic && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Topic:</p>
              <p className="font-medium">{topic.title}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Current Category:
              </p>
              <p>{topic.currentCategoryName}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Move to Category:
              </p>
              <Select
                value={selectedCategoryId}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {/* Level 1 Categories */}
                  {level1Categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}

                  {/* Level 2 Categories grouped by parent */}
                  {level1Categories.map((parentCategory) => {
                    const childCategories =
                      groupedCategories[parentCategory.id] || [];
                    if (childCategories.length === 0) return null;

                    return (
                      <div key={`group-${parentCategory.id}`}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {parentCategory.name} →
                        </div>
                        {childCategories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="pl-6"
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleMove}
                disabled={
                  !selectedCategoryId ||
                  selectedCategoryId === topic.currentCategoryId ||
                  moveTopicMutation.isPending
                }
              >
                {moveTopicMutation.isPending ? "Moving..." : "Move Topic"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
