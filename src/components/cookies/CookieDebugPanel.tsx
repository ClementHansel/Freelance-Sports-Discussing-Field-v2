"use client";

import React from "react";

// Dynamically import the correct component based on the environment
let CookieDebugPanelComponent: React.FC;

// Use a self-executing async function to handle dynamic imports conditionally
(async () => {
  if (typeof window !== "undefined") {
    // Ensure this runs only on the client
    if (process.env.NODE_ENV === "development") {
      const { CookieDebugPanelDev } = await import("./CookieDebugPanel.dev");
      CookieDebugPanelComponent = CookieDebugPanelDev;
    } else {
      const { CookieDebugPanelProd } = await import("./CookieDebugPanel.prod");
      CookieDebugPanelComponent = CookieDebugPanelProd;
    }
  }
})(); // Immediately invoke

export const CookieDebugPanel: React.FC = () => {
  // Render the component only if it has been assigned
  if (!CookieDebugPanelComponent) {
    return null; // Or a loading state if preferred
  }
  return <CookieDebugPanelComponent />;
};
