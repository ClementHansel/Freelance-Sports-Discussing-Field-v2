// src/components/dashboard/analytics/EnhancedHeaderCodeInjector.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useForumSettings } from "@/hooks/useForumSettings";
import DOMPurify from "dompurify";
import { Json } from "@/integrations/supabase/types"; // Import Json type if available, otherwise use unknown

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
  const legacyHeaderCode = getSetting("header_code", "") as string;

  // Use 'unknown' or 'Json' (if imported) instead of 'any'
  const headerScriptsRawValue: unknown = getSetting("header_scripts", "[]");

  // Use useMemo to memoize the headerScripts array
  const headerScripts: HeaderScript[] = useMemo(() => {
    let headerScriptsString: string;

    // Safely convert headerScriptsRawValue to a string representation
    if (typeof headerScriptsRawValue === "string") {
      headerScriptsString = headerScriptsRawValue;
    } else if (
      headerScriptsRawValue === null ||
      headerScriptsRawValue === undefined
    ) {
      headerScriptsString = "[]"; // Default to empty array string if null/undefined
    } else {
      // If it's an array or object, stringify it
      try {
        headerScriptsString = JSON.stringify(headerScriptsRawValue);
      } catch (stringifyError) {
        console.error(
          "Error stringifying headerScriptsRawValue:",
          stringifyError
        );
        console.error(
          "Problematic headerScriptsRawValue:",
          headerScriptsRawValue
        );
        return []; // Return empty array if stringification fails
      }
    }

    // --- ADDED DEBUGGING LOGS (now using headerScriptsString) ---
    console.log(
      "DEBUG: headerScriptsString value (after conversion):",
      headerScriptsString
    );
    console.log(
      "DEBUG: typeof headerScriptsString:",
      typeof headerScriptsString
    );
    console.log(
      "DEBUG: headerScriptsString length:",
      headerScriptsString?.length
    );
    // --- END DEBUGGING LOGS ---

    try {
      const trimmedRaw = headerScriptsString.trim(); // Now .trim() is safe because headerScriptsString is guaranteed to be a string

      if (trimmedRaw === "") {
        console.warn(
          "Header scripts setting is empty or whitespace-only after trimming. Returning empty array."
        );
        return [];
      }

      // Attempt to parse the now-guaranteed-string JSON
      return JSON.parse(trimmedRaw) as HeaderScript[];
    } catch (error) {
      console.error("Error parsing header scripts:", error);
      // Log the problematic string that caused the error for further investigation
      console.error(
        "Malformed headerScriptsString that caused JSON.parse error:",
        headerScriptsString
      );
    }
    return []; // Return an empty array on error or if raw string is empty/null/undefined
  }, [headerScriptsRawValue]); // Depend on the raw value from getSetting

  // Check if advertising is enabled
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
