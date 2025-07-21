import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import AdminSEO, disabling server-side rendering
const AdminSEOClient = dynamic(() => import("@/components/admin/seo/Seo"), {
  ssr: false, // This prevents useSearchParams() from being called during SSR
  loading: () => (
    <Card className="p-6">
      <div className="text-center">Loading SEO settings...</div>
    </Card>
  ),
});

export default function SeoPage() {
  return (
    <div className="flex-1 w-full">
      {/* The client component will only be rendered in the browser */}
      <AdminSEOClient />
    </div>
  );
}
