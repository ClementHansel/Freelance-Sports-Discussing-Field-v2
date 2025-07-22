import Forum from "@/components/forum/Forum";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function ForumPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <Forum />
    </Suspense>
  );
}
