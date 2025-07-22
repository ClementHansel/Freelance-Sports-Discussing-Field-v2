import Topics from "@/components/forum/topics/Topics";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function TopicsPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <Topics />
    </Suspense>
  );
}
