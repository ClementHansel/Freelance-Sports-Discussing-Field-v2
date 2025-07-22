import Topic from "@/components/forum/category/topic/Topic";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function TopicPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <Topic />
    </Suspense>
  );
}
