import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import AdminUsersPage from "../page";
import UserManagement from "@/components/dashboard/admin/UserManagement";

export default function AdminUserPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <UserManagement />
    </Suspense>
  );
}
