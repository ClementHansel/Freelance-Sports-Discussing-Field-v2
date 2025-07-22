import NotFound from "@/components/NotFound";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function NotFoundPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <NotFound />
    </Suspense>
  );
}
