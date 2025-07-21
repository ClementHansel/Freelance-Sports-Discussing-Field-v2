import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import AdminDashboard, disabling server-side rendering
const AdminDashboardClient = dynamic(
  () => import("@/components/dashboard/admin/AdminDashboard"),
  {
    ssr: false, // Prevents useSearchParams() (and other client-only APIs) from being called during SSR
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading admin dashboard...</div>
      </Card>
    ),
  }
);

export default function AdminPage() {
  return (
    <div className="flex-1 w-full">
      {/* The client component will only be rendered in the browser */}
      <AdminDashboardClient />
    </div>
  );
}
