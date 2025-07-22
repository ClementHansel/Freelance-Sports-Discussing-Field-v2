import AdminContent from "@/components/admin/content/Content";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminContentPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
