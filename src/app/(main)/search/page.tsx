import SearchPageComponent from "@/components/forum/search/Search";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <SearchPageComponent />
    </Suspense>
  );
}
