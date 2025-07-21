"use client";

import { useEffect } from "react";
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
  const legacyHeaderCode = getSetting("header_code", "");
  const headerScriptsRaw = getSetting("header_scripts", "[]");

  let headerScripts: HeaderScript[] = [];
  try {
    headerScripts =
      headerScriptsRaw && headerScriptsRaw !== ""
        ? JSON.parse(headerScriptsRaw)
        : [];
  } catch (error) {
    console.error("Error parsing header scripts:", error);
    headerScripts = [];
  }

  // Check if advertising is enabled
  const advertisingEnabled =
    getSetting("advertising_enabled", "true") === "true";

  useEffect(() => {
    // Remove any existing custom header elements to avoid duplicates
    const existingElements = document.querySelectorAll("[data-custom-header]");
    existingElements.forEach((el) => el.remove());

    if (!advertisingEnabled) {
      return;
    }

    // Inject legacy header code if it exists
    if (legacyHeaderCode) {
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
  }, [legacyHeaderCode, headerScripts, advertisingEnabled]);

  return null;
};
