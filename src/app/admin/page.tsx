import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import AdminUsers from "./users/page";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <AdminUsers />
    </Suspense>
  );
}
