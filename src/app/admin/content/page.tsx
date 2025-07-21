"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Card } from "@/components/ui/card"; // Optional fallback UI

const AdminContent = dynamic(
  () => import("@/components/admin/content/Content"),
  {
    ssr: false,
  }
);

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
