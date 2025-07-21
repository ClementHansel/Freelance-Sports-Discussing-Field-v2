import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const TopicClient = dynamic(
  () => import("@/components/forum/category/topic/Topic"),
  {
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading content...</div>
      </Card>
    ),
  }
);

export default function CategorySlugPage() {
  return (
    <div className="flex-1 w-full">
      <TopicClient />
    </div>
  );
}
