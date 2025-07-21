import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const Privacy = dynamic(() => import("@/components/privacy/Privacy"), {
  ssr: false,
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function PrivacyPage() {
  return (
    <div className="flex-1 w-full">
      <Privacy />
    </div>
  );
}
