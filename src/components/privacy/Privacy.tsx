"use client"; // Assuming InlineContentEditor is a client component

import { InlineContentEditor } from "@/components/dashboard/admin/InlineContentEditor";
import { Card } from "@/components/ui/card";
import React, { Suspense } from "react";

// Changed to default export for Next.js page files
export default function Privacy() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <InlineContentEditor
        settingKey="privacy_content"
        title="Privacy Policy"
        defaultContent="" // Default content is empty, implying it's set via admin
      />
    </Suspense>
  );
}
