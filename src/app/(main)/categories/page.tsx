import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const CategoriesClient = dynamic(
  () => import("@/components/forum/categories/Categories"),
  {
    ssr: false,
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading content...</div>
      </Card>
    ),
  }
);

export default function CategoriesPage() {
  return (
    <div className="flex-1 w-full">
      <CategoriesClient />
    </div>
  );
}
