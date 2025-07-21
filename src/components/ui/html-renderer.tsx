"use client";

import React from "react";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface HTMLRendererProps {
  content: string;
  className?: string;
}

export const HTMLRenderer: React.FC<HTMLRendererProps> = ({
  content,
  className,
}) => {
  // Create a custom DOMPurify instance with CSS-friendly configuration
  const sanitizedContent = React.useMemo(() => {
    // Add a hook to preserve all CSS properties while blocking dangerous ones
    DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
      if (data.attrName === "style") {
        // Block dangerous CSS properties but allow others
        const dangerousPatterns = [
          /expression\s*\(/i,
          /javascript:/i,
          /data:/i,
          /vbscript:/i,
          /behavior\s*:/i,
          /-moz-binding/i,
        ];

        const hasDangerousContent = dangerousPatterns.some((pattern) =>
          pattern.test(data.attrValue)
        );

        if (hasDangerousContent) {
          data.keepAttr = false;
        }
      }

      // Allow data URLs for image src attributes
      if (data.attrName === "src" && node.tagName === "IMG") {
        if (data.attrValue.startsWith("data:image/")) {
          data.keepAttr = true;
        }
      }
    });

    const result = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "a",
        "code",
        "pre",
        "div",
        "span",
        "img",
      ],
      ALLOWED_ATTR: [
        "href",
        "target",
        "rel",
        "style",
        "class",
        "id",
        "src",
        "alt",
        "width",
        "height",
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ADD_TAGS: ["img"],
      ADD_ATTR: ["src", "alt", "width", "height"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
      FORBID_TAGS: ["script", "object", "embed", "form", "input"],
    });

    // Clean up the hook after use
    DOMPurify.removeHook("uponSanitizeAttribute");

    return result;
  }, [content]);

  return (
    <div
      className={cn("prose prose-sm max-w-none", className)}
      style={{
        direction: "ltr",
        textAlign: "left",
        unicodeBidi: "plaintext",
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default HTMLRenderer;
