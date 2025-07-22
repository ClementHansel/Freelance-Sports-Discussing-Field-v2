"use client";

import { useEffect, useMemo } from "react"; // Import useMemo
import { useForumSettings } from "@/hooks/useForumSettings";
import DOMPurify from "dompurify";

interface HeaderScript {
  id: string;
  name: string;
  description?: string;
  script: string;
  is_active: boolean;
}

export const EnhancedHeaderCodeInjector = () => {
  const { getSetting } = useForumSettings();

  // Get both legacy header code and new header scripts
  // Explicitly cast the return value of getSetting to string
  const legacyHeaderCode = getSetting("header_code", "") as string;
  const headerScriptsRaw = getSetting("header_scripts", "[]") as string;

  // Use useMemo to memoize the headerScripts array
  const headerScripts: HeaderScript[] = useMemo(() => {
    try {
      // Ensure headerScriptsRaw is a non-empty string before parsing
      if (headerScriptsRaw && headerScriptsRaw !== "") {
        // Cast the parsed JSON to HeaderScript[]
        return JSON.parse(headerScriptsRaw) as HeaderScript[];
      }
    } catch (error) {
      console.error("Error parsing header scripts:", error);
    }
    return []; // Return an empty array on error or if raw string is empty
  }, [headerScriptsRaw]); // Only re-run this memoization if headerScriptsRaw changes

  // Check if advertising is enabled
  // Explicitly cast the return value of getSetting to string
  const advertisingEnabled =
    (getSetting("advertising_enabled", "true") as string) === "true";

  useEffect(() => {
    // Ensure window is defined for client-side operations
    if (typeof window === "undefined") {
      return;
    }

    // Remove any existing custom header elements to avoid duplicates
    const existingElements = document.querySelectorAll("[data-custom-header]");
    existingElements.forEach((el) => el.remove());

    if (!advertisingEnabled) {
      return;
    }

    // Inject legacy header code if it exists
    if (legacyHeaderCode) {
      // Ensure legacyHeaderCode is treated as a string for DOMPurify
      const sanitizedLegacyCode = DOMPurify.sanitize(legacyHeaderCode, {
        ALLOWED_TAGS: ["script", "style", "meta", "link", "ins"],
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
          "class",
          "style",
          "data-ad-client",
          "data-ad-slot",
          "data-ad-format",
          "data-full-width-responsive",
        ],
        ALLOW_DATA_ATTR: true,
        ALLOW_UNKNOWN_PROTOCOLS: false,
      });

      const legacyContainer = document.createElement("div");
      legacyContainer.setAttribute("data-custom-header", "legacy");
      legacyContainer.innerHTML = sanitizedLegacyCode;
      document.head.appendChild(legacyContainer);
    }

    // Inject active header scripts
    headerScripts
      .filter((script) => script.is_active)
      .forEach((script, index) => {
        // Ensure script.script is treated as a string for DOMPurify
        const sanitizedScript = DOMPurify.sanitize(script.script, {
          ALLOWED_TAGS: ["script", "style", "meta", "link", "ins"],
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
            "class",
            "style",
            "data-ad-client",
            "data-ad-slot",
            "data-ad-format",
            "data-full-width-responsive",
          ],
          ALLOW_DATA_ATTR: true,
          ALLOW_UNKNOWN_PROTOCOLS: false,
        });

        const scriptContainer = document.createElement("div");
        scriptContainer.setAttribute(
          "data-custom-header",
          `script-${script.id}`
        );
        scriptContainer.innerHTML = sanitizedScript;
        document.head.appendChild(scriptContainer);
      });

    return () => {
      // Cleanup on unmount or when settings change
      const elements = document.querySelectorAll("[data-custom-header]");
      elements.forEach((el) => el.remove());
    };
  }, [legacyHeaderCode, headerScripts, advertisingEnabled]); // headerScripts is now stable due to useMemo

  return null;
};
