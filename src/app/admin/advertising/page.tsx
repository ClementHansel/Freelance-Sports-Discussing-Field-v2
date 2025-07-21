import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import the client component with SSR disabled
const AdminAdvertising = dynamic(
  () => import("@/components/dashboard/admin/AdminAdvertising"),
  {
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading content...</div>
      </Card>
    ),
  }
);

export default function AdminAdvertisingPage() {
  return <AdminAdvertising />;
}
