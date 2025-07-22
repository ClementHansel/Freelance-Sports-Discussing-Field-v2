import TermsComponent from "@/components/terms/Terms";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function TermsPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <TermsComponent />
    </Suspense>
  );
}
