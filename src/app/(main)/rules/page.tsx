import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const Rules = dynamic(() => import("@/components/rules/Rules"), {
  ssr: false,
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function RulesPage() {
  return (
    <div className="flex-1 w-full">
      <Rules />
    </div>
  );
}
