import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const ForumClient = dynamic(() => import("@/components/forum/Forum"), {
  ssr: false, // Disable SSR to avoid useSearchParams() issues
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function ForumPage() {
  return (
    <div className="flex-1 w-full">
      <ForumClient />
    </div>
  );
}
