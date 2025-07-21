import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const NotFound = dynamic(() => import("@/components/NotFound"), {
  ssr: false,
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function NotFoundPage() {
  return (
    <div className="flex-1 w-full">
      <NotFound />
    </div>
  );
}
