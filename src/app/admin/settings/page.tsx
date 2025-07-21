import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// This file already correctly uses dynamic with ssr: false.
// No changes are needed, but including it for confirmation.
const AdminSettingsClient = dynamic(
  () => import("@/components/admin/settings/AdminSettings"),
  {
    ssr: false, // This correctly prevents SSR for the client component
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading settings...</div>
      </Card>
    ),
  }
);

export default function AdminSettingsPage() {
  return (
    <div className="flex-1 w-full">
      <AdminSettingsClient />
    </div>
  );
}
