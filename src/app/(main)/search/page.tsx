import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const SearchClient = dynamic(() => import("@/components/forum/search/Search"), {
  ssr: false, // Important for useSearchParams()
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading content...</div>
    </Card>
  ),
});

export default function SearchPage() {
  return (
    <div className="flex-1 w-full">
      <SearchClient />
    </div>
  );
}
