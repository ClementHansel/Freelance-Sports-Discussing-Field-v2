"use client";

import React from "react";

// Dynamically import the correct component based on the environment
let CookieDebugPanelComponent: React.FC;

if (process.env.NODE_ENV === "development") {
  // In development, import the full debug panel
  const { CookieDebugPanelDev } = require("./CookieDebugPanel.dev");
  CookieDebugPanelComponent = CookieDebugPanelDev;
} else {
  // In production, import the component that renders null
  const { CookieDebugPanelProd } = require("./CookieDebugPanel.prod");
  CookieDebugPanelComponent = CookieDebugPanelProd;
}

export const CookieDebugPanel: React.FC = () => {
  return <CookieDebugPanelComponent />;
};
