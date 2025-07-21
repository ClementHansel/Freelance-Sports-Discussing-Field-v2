import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

const VPNBlockedClient = dynamic(
  () => import("@/components/forum/vpn-blocked/Vpn-Blocked"),
  {
    ssr: false, // Important for hooks like useSearchParams or useRouter
    loading: () => (
      <Card className="p-6">
        <div className="text-center">Loading content...</div>
      </Card>
    ),
  }
);

export default function VPNBlockedPage() {
  return (
    <div className="flex-1 w-full">
      <VPNBlockedClient />
    </div>
  );
}
