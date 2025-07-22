import Privacy from "@/components/privacy/Privacy";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function PrivacyPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <Privacy />
    </Suspense>
  );
}
