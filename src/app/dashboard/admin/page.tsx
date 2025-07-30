import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminHomePage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
