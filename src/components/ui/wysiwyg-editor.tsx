"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Not directly used in WysiwygEditor, but often part of forms
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link, // This is the Lucide React icon, not next/link
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  className?: string;
  disabled?: boolean;
  hideToolbar?: boolean;
  allowImages?: boolean;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = React.memo(
  ({
    value,
    onChange,
    placeholder = "Write your content here...",
    height = 300,
    className,
    disabled = false,
    hideToolbar = false,
    allowImages = true,
  }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [editorContent, setEditorContent] = useState(value || "");
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [useFallback, setUseFallback] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const isProcessingInput = useRef(false);
    const onChangeRef = useRef(onChange);
    const { toast } = useToast(); // Initialize toast

    // Keep onChange ref updated without causing re-renders
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    // Initialize editor with error handling and debugging
    useEffect(() => {
      const initializeEditor = async () => {
        try {
          setIsLoading(true);
          console.log("WysiwygEditor: Initializing editor...", {
            value,
            disabled,
            hideToolbar,
          });

          // Check if contentEditable is supported
          if (typeof document.execCommand !== "function") {
            console.warn(
              "WysiwygEditor: execCommand not supported, falling back to textarea"
            );
            setUseFallback(true);
            setErrorMessage("Rich text editing not supported in this browser.");
            return;
          }

          // Check if we're in a problematic environment
          if (typeof window === "undefined" || !window.getSelection) {
            console.warn("WysiwygEditor: Window/Selection API not available.");
            setUseFallback(true);
            setErrorMessage("Rich text editing not available.");
            return;
          }

          if (editorRef.current && !isInitialized) {
            try {
              // Test contentEditable functionality
              editorRef.current.contentEditable = "true";
              editorRef.current.innerHTML = value || "";

              // Test if we can focus the editor
              editorRef.current.focus();
              editorRef.current.blur();

              setIsInitialized(true);
              setHasError(false);
              console.log("WysiwygEditor: Successfully initialized.");
            } catch (error: unknown) {
              // Changed 'any' to 'unknown'
              // Catch error as 'unknown' and then safely access .message
              console.error(
                "WysiwygEditor: Error initializing contentEditable:",
                error
              );
              setHasError(true);
              setUseFallback(true);
              setErrorMessage(
                `Editor initialization failed: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
            }
          }
        } catch (error: unknown) {
          // Changed 'any' to 'unknown'
          // Catch error as 'unknown' and then safely access .message
          console.error(
            "WysiwygEditor: Unexpected error during initialization:",
            error
          );
          setHasError(true);
          setUseFallback(true);
          setErrorMessage(
            `Unexpected error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        } finally {
          setIsLoading(false);
        }
      };

      // Added disabled and hideToolbar to dependencies
      initializeEditor();
    }, [value, isInitialized, disabled, hideToolbar]);

    // Improved cursor position utilities
    const saveCursorPosition = useCallback(() => {
      try {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount || !editorRef.current)
          return null;

        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(editorRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);

        return {
          start: preSelectionRange.toString().length,
          end: preSelectionRange.toString().length + range.toString().length,
        };
      } catch (error: unknown) {
        // Changed 'any' to 'unknown'
        console.warn("WysiwygEditor: Error saving cursor position:", error);
        return null;
      }
    }, []);

    const restoreCursorPosition = useCallback(
      (savedSelection: { start: number; end: number }) => {
        try {
          const selection = window.getSelection();
          if (!selection || !editorRef.current || isProcessingInput.current)
            return;

          const textNodes: Text[] = [];
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while ((node = walker.nextNode())) {
            textNodes.push(node as Text);
          }

          let charIndex = 0;
          let startNode: Text | null = null;
          let endNode: Text | null = null;
          let startOffset = 0;
          let endOffset = 0;

          for (const textNode of textNodes) {
            const nodeLength = textNode.textContent?.length || 0;

            if (!startNode && charIndex + nodeLength >= savedSelection.start) {
              startNode = textNode;
              startOffset = savedSelection.start - charIndex;
            }

            if (!endNode && charIndex + nodeLength >= savedSelection.end) {
              endNode = textNode;
              endOffset = savedSelection.end - charIndex;
              break;
            }

            charIndex += nodeLength;
          }

          if (startNode) {
            const range = document.createRange();
            range.setStart(
              startNode,
              Math.min(startOffset, startNode.textContent?.length || 0)
            );
            range.setEnd(
              endNode || startNode,
              Math.min(
                endOffset,
                (endNode || startNode).textContent?.length || 0
              )
            );

            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (error: unknown) {
          // Changed 'any' to 'unknown'
          console.warn(
            "WysiwygEditor: Error restoring cursor position:",
            error
          );
        }
      },
      []
    );

    // Very conservative content cleaning - only clean on blur or submission
    const debouncedCleanContent = useCallback(
      (content: string) => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
          try {
            if (isProcessingInput.current) return;

            // Only clean truly problematic elements and only when not actively typing
            const cleanContent = content
              .replace(/<p><\/p>/g, "") // Remove empty paragraphs
              .replace(/<div><\/div>/g, "") // Remove empty divs
              .replace(/<br\s*\/?>(\s*<br\s*\/?>)+/g, "<br>"); // Collapse multiple line breaks

            // Only update if content has actually changed significantly
            if (cleanContent !== content && cleanContent !== editorContent) {
              setEditorContent(cleanContent);
              onChangeRef.current(cleanContent);
            }
          } catch (error: unknown) {
            // Changed 'any' to 'unknown'
            console.error(
              "WysiwygEditor: Error in debouncedCleanContent:",
              error
            );
          }
        }, 1000); // Longer debounce to avoid interrupting typing
      },
      [editorContent]
    );

    // Simplified handleInput that avoids DOM manipulation during typing
    const handleInput = useCallback(() => {
      try {
        if (editorRef.current && !isProcessingInput.current) {
          const content = editorRef.current.innerHTML;

          // Only update state if content has changed - NO DOM manipulation during typing
          if (content !== editorContent) {
            setEditorContent(content);
            onChangeRef.current(content);

            // Only trigger cleaning when user pauses typing
            debouncedCleanContent(content);
          }
        }
      } catch (error: unknown) {
        // Changed 'any' to 'unknown'
        console.error("WysiwygEditor: Error in handleInput:", error);
        setHasError(true);
        setErrorMessage(
          `Input error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }, [editorContent, debouncedCleanContent]);

    // Handle blur event to clean content when user finishes typing
    const handleBlur = useCallback(() => {
      try {
        if (editorRef.current && !isProcessingInput.current) {
          const content = editorRef.current.innerHTML;

          // Clean content more aggressively when user finishes typing
          const cleanContent = content
            .replace(/<p><\/p>/g, "") // Remove empty paragraphs
            .replace(/<div><\/div>/g, "") // Remove empty divs
            .replace(/<div><br><\/div>/g, "<br>") // Convert div breaks to br
            .replace(/<div>/g, "<br>") // Convert opening divs to br
            .replace(/<\/div>/g, "") // Remove closing divs
            .replace(/<br\s*\/?>(\s*<br\s*\/?>)+/g, "<br>") // Collapse multiple line breaks
            .replace(/(<br\s*\/?>)+$/, ""); // Remove trailing line breaks

          // Update content if it changed
          if (cleanContent !== content) {
            isProcessingInput.current = true;
            editorRef.current.innerHTML = cleanContent;
            setEditorContent(cleanContent);
            onChangeRef.current(cleanContent);

            // Reset processing flag
            setTimeout(() => {
              isProcessingInput.current = false;
            }, 50);
          }
        }
      } catch (error: unknown) {
        // Changed 'any' to 'unknown'
        console.error("WysiwygEditor: Error in handleBlur:", error);
      }
    }, []);

    const handleFocus = useCallback(() => {
      // Clear any pending debounced operations when user starts typing
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Let the browser handle all keyboard events naturally
      // No custom handling that could interfere with text direction
      return;
    };

    const execCommand = useCallback(
      (command: string, value?: string) => {
        try {
          if (useFallback) return; // Don't execute commands in fallback mode

          const cursorPosition = saveCursorPosition();
          document.execCommand(command, false, value);
          editorRef.current?.focus();

          // Restore cursor position after command execution
          if (cursorPosition) {
            setTimeout(() => restoreCursorPosition(cursorPosition), 10);
          }

          handleInput();
        } catch (error: unknown) {
          // Changed 'any' to 'unknown'
          console.error(
            "WysiwygEditor: Error executing command:",
            command,
            error
          );
          setHasError(true);
          setErrorMessage(
            `Command error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
      [useFallback, saveCursorPosition, restoreCursorPosition, handleInput]
    );

    const retryInitialization = () => {
      setHasError(false);
      setUseFallback(false);
      setIsInitialized(false);
      setErrorMessage("");
      console.log("WysiwygEditor: Retrying initialization...");
    };

    const insertLink = useCallback(() => {
      const url = prompt("Enter URL:");
      if (url) {
        const selection = window.getSelection();
        const text = selection?.toString() || url;
        execCommand(
          "insertHTML",
          `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
        );
      }
    }, [execCommand]);

    const insertImage = useCallback(() => {
      if (!allowImages) return;
      fileInputRef.current?.click();
    }, [allowImages]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create preview URL and insert into editor
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        // Explicitly type e
        const imageUrl = e.target?.result as string;
        const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
        execCommand("insertHTML", imageHtml);
      };
      reader.readAsDataURL(file);

      // Clear the input
      event.target.value = "";
    };

    const formatText = useCallback(
      (command: string) => {
        execCommand(command);
      },
      [execCommand]
    );

    const toolbarButtons = [
      { icon: Bold, command: "bold", title: "Bold (Ctrl+B)" },
      { icon: Italic, command: "italic", title: "Italic (Ctrl+I)" },
      { icon: Underline, command: "underline", title: "Underline (Ctrl+U)" },
      { icon: List, command: "insertUnorderedList", title: "Bullet List" },
      {
        icon: ListOrdered,
        command: "insertOrderedList",
        title: "Numbered List",
      },
      {
        icon: Quote,
        command: "formatBlock",
        value: "blockquote",
        title: "Quote",
      },
      { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
      { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
      { icon: AlignRight, command: "justifyRight", title: "Align Right" },
    ];

    const handleFallbackChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setEditorContent(newValue);
        onChangeRef.current(newValue);
      },
      []
    );

    // Show loading state
    if (isLoading) {
      return (
        <div
          className={cn(
            "w-full max-w-full border border-input rounded-md bg-background flex items-center justify-center",
            className
          )}
          style={{ height }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading editor...</span>
          </div>
        </div>
      );
    }

    // Show fallback textarea if needed
    if (useFallback) {
      return (
        <div className={cn("w-full max-w-full", className)}>
          {hasError && (
            <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{errorMessage}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retryInitialization}
                  className="ml-auto h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          )}
          <Textarea
            value={editorContent}
            onChange={handleFallbackChange}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[200px] resize-vertical"
            style={{ height: height - 40 }}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "w-full max-w-full border border-input rounded-md bg-background overflow-hidden",
          className
        )}
      >
        {/* Error banner */}
        {hasError && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-2">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{errorMessage}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryInitialization}
                className="ml-auto h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseFallback(true)}
                className="h-6 px-2 text-xs"
              >
                Use Simple Editor
              </Button>
            </div>
          </div>
        )}

        {/* Sticky Toolbar */}
        {!hideToolbar && !useFallback && (
          <div
            className="sticky top-0 z-10 flex items-center gap-1 p-2 border-b border-input bg-muted/50 overflow-x-auto scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {toolbarButtons.map((button, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={() =>
                  button.value
                    ? execCommand(button.command, button.value)
                    : formatText(button.command)
                }
                title={button.title}
                disabled={disabled || useFallback}
              >
                <button.icon className="h-4 w-4" />
              </Button>
            ))}

            {allowImages && !useFallback && (
              <>
                <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 flex-shrink-0"
                  onClick={insertLink}
                  title="Insert Link"
                  disabled={disabled || useFallback}
                >
                  <Link className="h-4 w-4 mr-1" />
                  <span className="text-xs hidden sm:inline">Link</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 flex-shrink-0"
                  onClick={insertImage}
                  title="Insert Image"
                  disabled={disabled || useFallback}
                >
                  <Image className="h-4 w-4 mr-1" />
                  <span className="text-xs hidden sm:inline">Image</span>
                </Button>
              </>
            )}
          </div>
        )}

        {/* Hidden file input for image uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Upload image file"
        />

        {/* Scrollable Editor Container */}
        {!useFallback && (
          <div
            className="relative"
            style={{
              height: height - (hideToolbar ? 0 : 48) - (hasError ? 40 : 0),
              overflowY: "auto",
            }}
          >
            <div
              ref={editorRef}
              contentEditable={!disabled && !useFallback}
              className={cn(
                "w-full max-w-full p-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-full prose prose-sm break-words",
                disabled && "opacity-50 cursor-not-allowed",
                useFallback && "hidden"
              )}
              style={{
                maxWidth: "100%",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto",
                direction: "ltr",
                textAlign: "left",
                unicodeBidi: "plaintext",
              }}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              data-placeholder={placeholder}
              dir="ltr"
              suppressContentEditableWarning={true}
              onError={(e: React.SyntheticEvent<HTMLDivElement, Event>) => {
                // Explicitly type e
                console.error("WysiwygEditor: ContentEditable error:", e);
                setHasError(true);
                setUseFallback(true);
                setErrorMessage("Editor encountered an error");
              }}
            />
          </div>
        )}

        <style>{`
        /* Hide scrollbars on toolbar */
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          position: absolute;
        }
        [contenteditable] {
          line-height: 1.6;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          white-space: pre-wrap;
          box-sizing: border-box;
        }
        [contenteditable] * {
          max-width: 100% !important;
          box-sizing: border-box;
        }
        [contenteditable] img {
          max-width: 100% !important;
          width: 100% !important;
          height: auto !important;
          display: block;
          margin: 10px 0;
          object-fit: contain;
        }
        [contenteditable] h1, 
        [contenteditable] h2, 
        [contenteditable] h3 {
          font-weight: 600;
          margin: 1em 0 0.5em 0;
          word-wrap: break-word;
        }
        [contenteditable] h1 { font-size: 1.5em; }
        [contenteditable] h2 { font-size: 1.3em; }
        [contenteditable] h3 { font-size: 1.1em; }
        [contenteditable] p { 
          margin: 0.5em 0; 
          word-wrap: break-word;
        }
        [contenteditable] ul, 
        [contenteditable] ol { 
          margin: 0.5em 0; 
          padding-left: 1.5em;
        }
        [contenteditable] blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
          word-wrap: break-word;
        }
        [contenteditable] a {
          color: hsl(var(--primary));
          text-decoration: underline;
          word-break: break-all;
          overflow-wrap: break-word;
        }
        [contenteditable] br {
          line-height: 1.6;
        }
        [contenteditable] div,
        [contenteditable] span {
          max-width: 100%;
          word-wrap: break-word;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 640px) {
          [contenteditable] {
            font-size: 16px; /* Prevents zoom on iOS */
            -webkit-text-size-adjust: 100%;
          }
          [contenteditable] * {
            max-width: calc(100vw - 2rem) !important;
          }
        }
      `}</style>
      </div>
    );
  }
);

export default WysiwygEditor;
