import Blog from "@/components/blog/Blog";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <Blog />
    </Suspense>
  );
}
