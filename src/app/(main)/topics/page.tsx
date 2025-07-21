import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const TopicsClient = dynamic(() => import("@/components/forum/topics/Topics"), {
  ssr: false, // Ensures it's rendered client-side
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function TopicsPage() {
  return (
    <div className="flex-1 w-full">
      <TopicsClient />
    </div>
  );
}
