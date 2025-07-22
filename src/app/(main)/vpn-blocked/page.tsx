import VPNBlocked from "@/components/forum/vpn-blocked/Vpn-Blocked";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

export default function VpnBlockedPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6">
          <div className="text-center">Loading content...</div>
        </Card>
      }
    >
      <VPNBlocked />
    </Suspense>
  );
}
