import ForumRules from "@/components/rules/Rules";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function RulesPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <ForumRules />
    </Suspense>
  );
}
