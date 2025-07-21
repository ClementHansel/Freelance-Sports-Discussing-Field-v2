import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const BlogClient = dynamic(() => import("@/components/blog/Blog"), {
  ssr: false,
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function BlogPage() {
  return (
    <div className="flex-1 w-full">
      <BlogClient />
    </div>
  );
}
