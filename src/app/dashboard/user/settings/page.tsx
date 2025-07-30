import SettingsForum from "@/components/forum/settings/Settings";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <SettingsForum />
    </Suspense>
  );
}
