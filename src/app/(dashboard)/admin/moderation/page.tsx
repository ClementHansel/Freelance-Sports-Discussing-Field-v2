import AdminModeration from "@/components/dashboard/admin/moderation/Moderation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminModerationPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminModeration />
    </Suspense>
  );
}
