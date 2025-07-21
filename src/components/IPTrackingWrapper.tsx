"use client";

import React from "react";
import { useIPTracker } from "@/hooks/useIPTracker";

interface IPTrackingWrapperProps {
  children: React.ReactNode;
}

export const IPTrackingWrapper: React.FC<IPTrackingWrapperProps> = ({
  children,
}) => {
  useIPTracker();
  return <>{children}</>;
};
