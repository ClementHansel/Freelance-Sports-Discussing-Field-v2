import UsersManagement from "@/components/dashboard/admin/users-management/UserManagement";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <UsersManagement />
    </Suspense>
  );
}
