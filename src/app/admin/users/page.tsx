import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import UserManagement, disabling server-side rendering
const UserManagementClient = dynamic(
  () => import("@/components/dashboard/admin/UserManagement"),
  {
    ssr: false, // Prevents useSearchParams() (and other client-only APIs) from being called during SSR
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading user management...</div>
      </Card>
    ),
  }
);

export default function AdminUsers() {
  return (
    <div className="flex-1 w-full">
      {/* The client component will only be rendered in the browser */}
      <UserManagementClient />
    </div>
  );
}
