"use client";

import { useEffect } from "react";
import { useForumSettings } from "@/hooks/useForumSettings";
import DOMPurify from "dompurify";

export const HeaderCodeInjector = () => {
  const { getSetting } = useForumSettings();
  const headerCode = getSetting("header_code", "");

  useEffect(() => {
    if (!headerCode) return;

    // Remove any existing custom header elements to avoid duplicates
    const existingElements = document.querySelectorAll("[data-custom-header]");
    existingElements.forEach((el) => el.remove());

    // Sanitize the header code to prevent XSS attacks
    const sanitizedCode = DOMPurify.sanitize(headerCode, {
      ALLOWED_TAGS: ["script", "style", "meta", "link"],
      ALLOWED_ATTR: [
        "src",
        "href",
        "type",
        "rel",
        "charset",
        "name",
        "content",
        "property",
        "async",
        "crossorigin",
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });

    // Create a container for the custom header code
    const container = document.createElement("div");
    container.setAttribute("data-custom-header", "true");
    container.innerHTML = sanitizedCode;

    // Append to head
    document.head.appendChild(container);

    return () => {
      // Cleanup on unmount or when header code changes
      const elements = document.querySelectorAll("[data-custom-header]");
      elements.forEach((el) => el.remove());
    };
  }, [headerCode]);

  return null;
};
