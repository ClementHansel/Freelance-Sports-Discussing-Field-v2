import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const SettingsForumClient = dynamic(
  () => import("@/components/forum/settings/Settings"),
  {
    ssr: false, // Prevents build errors caused by useSearchParams
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading content...</div>
      </Card>
    ),
  }
);

export default function SettingsForumPage() {
  return (
    <div className="flex-1 w-full">
      <SettingsForumClient />
    </div>
  );
}
