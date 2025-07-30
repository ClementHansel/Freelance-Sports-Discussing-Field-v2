import AdminAdvertising from "@/components/dashboard/admin/advertising/AdminAdvertising";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminAdvertisingPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminAdvertising />
    </Suspense>
  );
}
