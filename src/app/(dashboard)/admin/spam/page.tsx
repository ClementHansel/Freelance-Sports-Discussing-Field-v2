import SpamManagement from "@/components/dashboard/admin/spam/SpamManagement";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminSpamPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <SpamManagement />
    </Suspense>
  );
}
