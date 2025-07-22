import CategoriesSlug from "@/components/forum/categories/Categories";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <CategoriesSlug />
    </Suspense>
  );
}
