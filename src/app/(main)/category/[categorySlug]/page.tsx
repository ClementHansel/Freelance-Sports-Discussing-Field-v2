import CategorySlug from "@/components/forum/category/Category";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <CategorySlug />
    </Suspense>
  );
}
