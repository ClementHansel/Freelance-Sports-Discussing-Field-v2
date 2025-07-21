import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import SpamManagement, disabling server-side rendering
const SpamManagementClient = dynamic(
  () => import("@/components/dashboard/admin/SpamManagement"),
  {
    ssr: false, // Prevents useSearchParams() (and other client-only APIs) from being called during SSR
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading spam management...</div>
      </Card>
    ),
  }
);

export default function AdminSpamPage() {
  return (
    <div className="flex-1 w-full">
      {/* The client component will only be rendered in the browser */}
      <SpamManagementClient />
    </div>
  );
}
