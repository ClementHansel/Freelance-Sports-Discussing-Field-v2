import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const Terms = dynamic(() => import("@/components/terms/Terms"), {
  ssr: false,
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function TermsPage() {
  return (
    <div className="flex-1 w-full">
      <Terms />
    </div>
  );
}
