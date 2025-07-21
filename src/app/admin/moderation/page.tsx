import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import AdminModeration, disabling server-side rendering
const AdminModerationClient = dynamic(
  () => import("@/components/admin/moderation/Moderation"),
  {
    ssr: false, // This prevents useSearchParams() from being called during SSR
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading moderation dashboard...</div>
      </Card>
    ),
  }
);

export default function ModerationPage() {
  return (
    <div className="flex-1 w-full">
      {/* The client component will only be rendered in the browser */}
      <AdminModerationClient />
    </div>
  );
}
