import AdminSEO from "@/components/admin/seo/Seo";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminSeoPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminSEO />
    </Suspense>
  );
}
