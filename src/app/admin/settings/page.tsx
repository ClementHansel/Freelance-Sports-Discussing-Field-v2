import AdminSettings from "@/components/admin/settings/AdminSettings";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminSettings />
    </Suspense>
  );
}
