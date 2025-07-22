"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { HTMLRenderer } from "@/components/ui/html-renderer";
import { useForumSettings } from "@/hooks/useForumSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { Edit3, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InlineContentEditorProps {
  settingKey: string;
  title: string;
  defaultContent?: string;
}

export const InlineContentEditor: React.FC<InlineContentEditorProps> = ({
  settingKey,
  title,
  defaultContent = "",
}) => {
  const { getSetting, updateSetting, isUpdating } = useForumSettings();
  const { canViewAdminPanel } = usePermissions();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  // Explicitly cast the result of getSetting to string
  const content = getSetting(settingKey, defaultContent) as string;

  const cleanHtmlForEditor = (htmlContent: string) => {
    if (!htmlContent) return "";

    console.log(
      "🧹 Cleaning HTML for editor. Original length:",
      htmlContent.length
    );

    // Remove Tiptap editor metadata that can interfere with editing
    const cleaned = htmlContent
      .replace(/\s*data-start="[^"]*"/g, "")
      .replace(/\s*data-end="[^"]*"/g, "")
      .replace(/\s*data-placeholder="[^"]*"/g, "")
      .replace(/\s*contenteditable="[^"]*"/g, "")
      .trim();

    console.log("✨ Cleaned HTML length:", cleaned.length);
    console.log(
      "🔍 Cleaned content preview:",
      cleaned.substring(0, 300) + "..."
    );

    return cleaned;
  };

  const handleEdit = () => {
    console.log("🎯 handleEdit called for settingKey:", settingKey);
    console.log(
      "📊 Raw content from getSetting:",
      content ? "Content exists" : "No content"
    );
    console.log("📏 Raw content length:", content.length || 0); // content is now guaranteed string

    // Get the current content from database or fallback to default
    const rawContent = content || defaultContent; // rawContent is now guaranteed string
    const cleanedContent = cleanHtmlForEditor(rawContent);

    console.log("🔄 Loading content for editing:", {
      settingKey,
      hasRawContent: !!rawContent,
      rawContentPreview: rawContent.substring(0, 200) + "...",
      hasCleanedContent: !!cleanedContent,
      cleanedContentPreview: cleanedContent.substring(0, 200) + "...",
      rawLength: rawContent.length,
      cleanedLength: cleanedContent.length,
    });

    setEditContent(cleanedContent);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateSetting({
        key: settingKey,
        value: editContent,
        type: "code", // Assuming 'code' is the correct type for HTML content
        category: "legal", // Assuming 'legal' is the correct category
        description: `${title} content`,
      });
      setIsEditing(false);
      toast({
        title: "Content Updated",
        description: `${title} has been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${title.toLowerCase()}.`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditContent("");
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        {canViewAdminPanel && !isEditing && (
          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <WysiwygEditor
            value={editContent}
            onChange={setEditContent}
            height={400}
            placeholder={`Enter ${title.toLowerCase()} content here...`}
            allowImages={true}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isUpdating}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-slate max-w-none">
          {/* Ensure content is always a string for HTMLRenderer */}
          {content ? (
            <HTMLRenderer content={content} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {title} content is not available.
              </p>
            </div>
          )}
        </div>
      )}

      {!isEditing && (
        <div className="border-t pt-6 mt-8">
          <p className="text-sm text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};
